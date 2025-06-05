import { Controller, Get, Query, Res, HttpStatus, UseGuards, Request } from '@nestjs/common';
import { Response } from 'express';
import { ApiHeader, ApiOperation, ApiQuery, ApiResponse, ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ErrorHandler } from 'src/shared/exceptions/error.handler';
import { JwtAuthGuard } from 'src/shared/guard/jwt-auth.guard';
import { GetRedisSeatService } from './getRedisSeat.service';
import { GetRedisSeatResponseDto } from './getRedisSeat-response.dto';

@ApiTags('Booking Service - Booking')
@Controller('api/booking')
export class GetRedisSeatController {
  constructor(private readonly getRedisSeatService: GetRedisSeatService) {}

  @UseGuards(JwtAuthGuard)
  @Get('/getRedisSeat')
  @ApiQuery({ name: 'showingId', type: String, required: true, example: '16962844867169' })
    @ApiBearerAuth('access-token')

  @ApiOperation({ summary: 'Get seat in Redis' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Redis seat status data retrieved successfully',
    type: GetRedisSeatResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Redis time is expired',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Internal server error',
  })
  async getShowing(
    @Request() req,
    @Query('showingId') showingId: string,
    @Res() res: Response) {
    const email = req.user.email;
    const result = await this.getRedisSeatService.execute(showingId, email);
    if (result.isErr()) {
      const error = result.unwrapErr();
      return res
        .status(error.message === 'Internal Server Error.' ? HttpStatus.INTERNAL_SERVER_ERROR : HttpStatus.BAD_REQUEST)
        .json(error.message === 'Internal Server Error.' ? ErrorHandler.internalServerError(result.unwrapErr().message) : ErrorHandler.badRequest(result.unwrapErr().message));
    }

    const data = result.unwrap();
    return res.status(HttpStatus.OK).json({
      statusCode: HttpStatus.OK,
      message: 'Redis seat data retrieved successfully',
      data,
    });
  }
}