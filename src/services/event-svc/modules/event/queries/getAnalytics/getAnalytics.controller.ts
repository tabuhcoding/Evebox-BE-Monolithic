import { Controller, Get, Post, Res, HttpStatus, UseGuards, Param, Request, Query, Body } from "@nestjs/common";
import { Response } from "express";
import { ApiBearerAuth, ApiBody, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from "src/shared/guard/jwt-auth.guard";
import { GetAnalyticsService } from "./getAnalytics.service";
import { AnalyticsResponseDto, AnalyticsAIResponseDto } from "./getAnalytics-response.dto";
import { GetAnalyticsWithAI } from "./getAnalytics.dto";
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
      await this.slackService.sendError(`Event Service - Event analytics >>> GetAnalyticsController: ${error.message}`);

      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Internal server error',
      })
    }
  }

  @UseGuards(JwtAuthGuard)
  @Post('analytic-ai/:eventId')
  @ApiBearerAuth('access-token')
  @ApiBody({ type: GetAnalyticsWithAI })
  @ApiOperation({ summary: 'Get event analytics' })
  @ApiQuery({ name: 'startDate', description: 'Start date of event', required: false })
  @ApiQuery({ name: 'endDate', description: 'End date of event', required: false })
  @ApiResponse({ status: HttpStatus.OK, description: 'Analytics retrieved successfully', type: AnalyticsAIResponseDto })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Bad request' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Internal server error' })
  async getAnalyticsAI(
    @Param('eventId') eventIdRaw: string,
    @Body() body: GetAnalyticsWithAI,
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

      const result = await this.getAnalyticsService.executeAI(eventId, email, start, end, body.query || "");
      if (result.isErr()) {
        return res.status(HttpStatus.BAD_REQUEST).json({ message: result.unwrapErr().message });
      }

      return res.status(HttpStatus.OK).json({
        statusCode: 200,
        message: 'Analytics retrieved successfully',
        data: result.unwrap(),
      });
    } catch (error) {
      await this.slackService.sendError(`Event Service - Event analytics >>> GetAnalyticsController: ${error.message}`);

      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Internal server error',
      })
    }
  }
}