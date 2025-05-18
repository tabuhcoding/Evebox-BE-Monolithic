import { Controller, Get, Query, Res, HttpStatus } from '@nestjs/common';
import { GetEventFrontDisplayService } from './getEventFrontDisplay.service';
import { Response } from 'express';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { GetEventFrontDisplayResponse } from './getEventFrontDisplay-response.dto';

@ApiTags('Event Service - Event')
@Controller('api/event')
export class GetEventFrontDisplayController {
  constructor(private readonly frontDisplayService: GetEventFrontDisplayService) {}

  @Get('/front-display')
  @ApiOperation({ summary: 'Get front display data' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Front display data retrieved successfully',
    type: GetEventFrontDisplayResponse,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Fetch front display data failed',
  })
  async getFrontDisplay(@Res() res: Response) {
    const result = await this.frontDisplayService.execute();

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
      message: 'Front display data retrieved successfully',
      data,
    });
  }
}
