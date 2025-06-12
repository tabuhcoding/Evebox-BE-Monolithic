import { Controller, Get, Request, Param, Res, UseGuards, HttpStatus } from "@nestjs/common";
import { Response } from "express";
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "src/shared/guard/jwt-auth.guard";
import { GetEventSummaryService } from "./getEventSummary.service";
import { EventSummaryResponse } from "./getEventSummary-response.dto";
import { SlackService } from "src/infrastructure/adapters/slack/slack.service";

@ApiTags('Event Service - Organizer - Statistics')
@Controller('api/org/statistics')
export class GetEventSummaryController {
  constructor(
    private readonly getEventSummaryService: GetEventSummaryService,
    private readonly slackService: SlackService
  ) { }

  @UseGuards(JwtAuthGuard)
  @Get('summary/:showingId')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get summary of a showing in event' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Event summary retrieved successfully', type: EventSummaryResponse })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Bad request' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Internal server error' })
  async getEventSummary(
    @Request() req,
    @Param('showingId') showingId: string,
    @Res() res: Response,
  ) {
    try {
      const email = req.user?.email;
      if (!email) {
        return res.status(HttpStatus.UNAUTHORIZED).json({
          statusCode: HttpStatus.UNAUTHORIZED,
          message: 'Unauthorized',
        });
      }

      if (!showingId) {
        return res.status(HttpStatus.UNAUTHORIZED).json({
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Showing ID is required',
        });
      }

      const result = await this.getEventSummaryService.execute(showingId, email);

      if (result.isErr()) {
        return res.status(HttpStatus.BAD_REQUEST).json({
          statusCode: HttpStatus.BAD_REQUEST,
          message: result.unwrapErr().message,
        });
      }

      return res.status(HttpStatus.OK).json({
        statusCode: HttpStatus.OK,
        message: 'Event summary retrieved successfully',
        data: result.unwrap()
      });
    } catch (error) {
      await this.slackService.sendError(`Event Service - Event of org >>> GetEventOfOrgController: ${error.message}`);

      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Internal server error',
      })
    }
  }

}