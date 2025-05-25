import { Controller, Get, Query, Res, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ErrorHandler } from 'src/shared/exceptions/error.handler';

import { getShowingSeatmapService } from './getShowingSeatmap.service';
import { SeatMapResponseDto } from './getShowingSeatmap-response.dto';

@ApiTags('Event Service - Showing')
@Controller('api/showing')
export class getShowingSeatmapController {
  constructor(private readonly getShowingSeatmapService: getShowingSeatmapService) {}

  @Get('/seatmap')
  @ApiOperation({ summary: 'Get seat map' })
  @ApiQuery({
    name: 'showingId',
    required: true,
    example: '15039597206755',
    description: 'The ID of the showing to retrieve',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Seat map retrieved successfully',
    type: SeatMapResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Seat map not found',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Internal server error',
  })
  async getSeatMap(@Query('showingId') showingId: string, @Res() res: Response) {
    const result = await this.getShowingSeatmapService.getSeatMap(showingId);

    if (result.isErr()) {
      const error = result.unwrapErr();
      return res
        .status(error.message === "Seat map not found." ? HttpStatus.NOT_FOUND : HttpStatus.BAD_REQUEST)
        .json(error.message === "Seat map not found." ? ErrorHandler.notFound(result.unwrapErr().message) : ErrorHandler.badRequest(result.unwrapErr().message));
    }

    const data = result.unwrap();
    return res.status(HttpStatus.OK).json({
      statusCode: HttpStatus.OK,
      message: 'Seat map retrieved successfully',
      data,
    });
  }
}

