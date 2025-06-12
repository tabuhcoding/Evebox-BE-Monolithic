import { Controller, Get, UseGuards, Query, HttpStatus, Res, Request } from "@nestjs/common";
import { GetEventDetailService } from "./getEventDetail.service";
import { JwtOptionalGuard } from 'src/shared/guard/jwt-optional.guard';
import { Response } from 'express';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ErrorHandler } from 'src/shared/exceptions/error.handler';
import { EventDetailResponse } from './getEventDetail-response.dto';
import { SlackService } from "src/infrastructure/adapters/slack/slack.service";

@ApiTags('Event Service - Event')
@Controller('api/event/detail')
export class GetEventDetailController {
  constructor(
    private readonly slackService: SlackService,
    private readonly eventDetailService: GetEventDetailService) {}

  @Get('/')
  @ApiBearerAuth('access-token')
  @UseGuards(JwtOptionalGuard)
  @ApiOperation({ summary: 'Get event details' })
  @ApiQuery({
    name: 'eventId',
    required: true,
    description: 'ID of the event to retrieve details for',
    type: String,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Event details retrieved successfully',
    type: EventDetailResponse,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Event not found',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Internal server error',
  })
  async getEventDetail(
    @Query('eventId') eventId: string,
    @Res() res: Response,
    @Request() req
  ) {
    void this.eventDetailService
      .increasePostClickCount(parseInt(eventId), req.user?.email)
      .catch((err) => {
        this.slackService.sendError(`Event Service - Event Detail >>> Increase PostClick: ${err.message}`);
      });

    const result = await this.eventDetailService.execute(parseInt(eventId), req.user?.email);
    if (result.isErr()) {
      const error = result.unwrapErr();
      return res
        .status(error.message === "Event not found." ? HttpStatus.NOT_FOUND : HttpStatus.BAD_REQUEST)
        .json(error.message === "Event not found." ? ErrorHandler.notFound(result.unwrapErr().message) : ErrorHandler.badRequest(result.unwrapErr().message));
    }

    const data = result.unwrap();
    return res.status(HttpStatus.OK).json({
      statusCode: HttpStatus.OK,
      message: 'Event details retrieved successfully',
      data,
    });
  }

}