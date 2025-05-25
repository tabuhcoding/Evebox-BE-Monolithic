import { Controller, Get, Res, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { getAllShowingService } from './getAllShowing.service';
import { AllShowingsResponseDto } from './getAllShowing-response.dto';

@ApiTags('Event Service - Showing')
@Controller('api/showing')
export class getAllShowingController {
  constructor(private readonly getAllShowingService: getAllShowingService) {}
  
  @Get('/all-showings')
  @ApiOperation({ summary: 'Get all showings' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'All showings retrieved successfully',
    type: AllShowingsResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Showing not found',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Internal server error',
  })
  async getAllShowings(@Res() res: Response) {
    const result = await this.getAllShowingService.getAllShowings();

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
      message: 'All showings retrieved successfully',
      data,
    });
  }
}