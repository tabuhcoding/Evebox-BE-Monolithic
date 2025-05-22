import { Controller, Get, Query, Res, HttpStatus } from '@nestjs/common';
import { GetRecommendEventService } from './getRecommendEvent.service';
import { Response } from 'express';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { GetRecommendEventResponse } from './getRecommendEvent-response.dto';

@ApiTags('Event Service - Event')
@Controller('api/event')
export class GetRecommendedEventController {
  constructor(private readonly frontDisplayService: GetRecommendEventService) {}

  @Get('/recommended-events')
  @ApiOperation({ summary: 'Get recommended events' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Recommended events retrieved successfully',
    type: GetRecommendEventResponse,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input',
  })
  @ApiQuery({
    name: 'timeWindow',
    enum: ['week', 'month'],
    required: true,
    description: 'Time window for recommended events (week or month)',
  })
  async getRecommendedEvents(
    @Query('timeWindow') timeWindow: 'week' | 'month',
    @Res() res: Response,
  ) {
    const result = await this.frontDisplayService.getRecommendedEvents(timeWindow);

    if (result.isErr()) {
      return res
        .status(HttpStatus.BAD_REQUEST)
        .json({
          statusCode: HttpStatus.BAD_REQUEST,
          message: result.unwrapErr().message,
        });
    }

    const data = result.unwrap();
    return res.status(HttpStatus.OK).json({
      statusCode: HttpStatus.OK,
      message: 'Recommended events retrieved successfully',
      data,
    });
  }
}
