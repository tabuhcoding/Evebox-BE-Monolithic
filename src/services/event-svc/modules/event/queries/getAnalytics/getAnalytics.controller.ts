import { Controller, Get, Res, HttpStatus, UseGuards, Param, Request, Query } from "@nestjs/common";
import { Response } from "express";
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from "src/shared/guard/jwt-auth.guard";
import { GetAnalyticsService } from "./getAnalytics.service";
import { AnalyticsResponseDto } from "./getAnalytics-response.dto";
import { SlackService } from "src/infrastructure/adapters/slack/slack.service";

@ApiTags('Event Service - Organizer - Statistics')
@Controller('api/org/statistics')
export class GetAnalyticsController {
  constructor(
    private readonly getAnalyticsService: GetAnalyticsService,
    private readonly slackService: SlackService
  ) { }

  @UseGuards(JwtAuthGuard)
  @Get('analytic/:eventId')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get event analytics' })
  @ApiQuery({ name: 'startDate', description: 'Start date of event', required: false })
  @ApiQuery({ name: 'endDate', description: 'End date of event', required: false })
  @ApiResponse({ status: HttpStatus.OK, description: 'Analytics retrieved successfully', type: AnalyticsResponseDto })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Bad request' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Internal server error' })
  async getAnalytics(
    @Param('eventId') eventIdRaw: string,
    @Request() req,
    @Res() res: Response,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    try {
      const email = req.user?.email;
      if (!email) {
        return res.status(HttpStatus.UNAUTHORIZED).json({
          statusCode: HttpStatus.UNAUTHORIZED,
          message: 'Unauthorized',
        });
      }

      if (!eventIdRaw) {
        return res.status(HttpStatus.UNAUTHORIZED).json({
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Event ID is required',
        });
      }

      const eventId = parseInt(eventIdRaw, 10);
      if (isNaN(eventId)) {
        return res.status(HttpStatus.BAD_REQUEST).json({ message: 'Invalid eventId' });
      }

      const start = startDate ? new Date(startDate) : undefined;
      const end = endDate ? new Date(endDate) : undefined;

      const result = await this.getAnalyticsService.execute(eventId, email, start, end);
      if (result.isErr()) {
        return res.status(HttpStatus.BAD_REQUEST).json({ message: result.unwrapErr().message });
      }

      return res.status(HttpStatus.OK).json({
        statusCode: 200,
        message: 'Analytics retrieved successfully',
        data: result.unwrap(),
      });
    } catch (error) {
      this.slackService.sendError(`Event Service - Event analytics >>> GetAnalyticsController: ${error.message}`);

      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Internal server error',
      })
    }
  }
}