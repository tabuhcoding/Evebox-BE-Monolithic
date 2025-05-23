import { Controller, Get, Post, Query, HttpStatus, Res } from "@nestjs/common";
import { GetEventDetailRecommendService } from "./getEventDetailRecommend.service";
import { Response } from 'express';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ErrorHandler } from 'src/shared/exceptions/error.handler';
import { GetEventDetailRecommendResponse } from "./getEventDetailRecommend-response.dto";

@ApiTags('Event Service - Event')
@Controller('api/event/detail')
export class GetEventDetailRecommendController {
  constructor(private readonly eventDetailService: GetEventDetailRecommendService) {}

  @Get('/recommended-events')
  @ApiOperation({ summary: 'Get recommended events' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Recommended events retrieved successfully',
    type: GetEventDetailRecommendResponse,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Event not found',
  })
  async getRecommendedEventsInDetail(
    @Query('eventId') eventId: string,
    @Query('limit') limit: string,
    @Res() res: Response,
  ) {
    const result = await this.eventDetailService.getRecommendedEventsInDetail(
      parseInt(eventId),
      limit,
    );

    if (result.isErr()) {
      const error = result.unwrapErr();
      return res
        .status(error.message === "Event not found." ? HttpStatus.NOT_FOUND : HttpStatus.BAD_REQUEST)
        .json(error.message === "Event not found." ? ErrorHandler.notFound(result.unwrapErr().message) : ErrorHandler.badRequest(result.unwrapErr().message));
    }

    const data = result.unwrap();
    return res.status(HttpStatus.OK).json({
      statusCode: HttpStatus.OK,
      message: 'Recommended events retrieved successfully',
      data,
    });
  }

}