import { Controller, Get, Res, HttpStatus, Param, Body, Post, UseGuards, Query } from '@nestjs/common';
import { Response } from 'express';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';

import { getAllShowingService } from './getAllShowing.service';
import { AllShowingsResponseDto, ConnectShowingToSeatmapDTO } from './getAllShowing-response.dto';
import { JwtAuthGuard } from 'src/shared/guard/jwt-auth.guard';

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

  @Get('/all-seatmaps/:id')
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
  async getAllSeatmap(
    @Param('id') id: string,
    @Res() res: Response) {
    const result = await this.getAllShowingService.getAllSeatmap(id);

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

  @Get('/seatmap-details/:id')
  @ApiOperation({ summary: 'Get all showings' })
  @ApiQuery({ name: 'showingId', required: true, description: 'Showing ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'All showings retrieved successfully',
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
  async getSeatmap(
    @Param('id') id: number,
    @Query('showingId') showingId: string,
    @Res() res: Response) {
    const result = await this.getAllShowingService.getSeatmapWithSection(showingId, id >> 0);

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

  // @UseGuards(JwtAuthGuard)
  // @ApiBearerAuth('access-token')
  @Post('/connect-showing-seatmap')
  @ApiOperation({ summary: 'Connect showing to seatmap' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Showing connected to seatmap successfully',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Showing or seatmap not found',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Internal server error',
  })
  async connectShowingToSeatmap(
    @Body() connectShowingToSeatmapDTO: ConnectShowingToSeatmapDTO,
    @Res() res: Response
  ) {
    const result = await this.getAllShowingService.connectShowingToSeatmap(
      connectShowingToSeatmapDTO
    );

    if (result.isErr()) {
      return res
        .status(HttpStatus.BAD_REQUEST)
        .json({
          statusCode: HttpStatus.BAD_REQUEST,
          message: result.unwrapErr().message,
        });
    }

    return res.status(HttpStatus.OK).json({
      statusCode: HttpStatus.OK,
      message: 'Showing connected to seatmap successfully',
    });
  }
}