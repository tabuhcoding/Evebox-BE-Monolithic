import { Controller, Delete, Param, Request, Res, HttpStatus, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { ApiOperation, ApiResponse, ApiHeader, ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ErrorHandler } from 'src/shared/exceptions/error.handler';
import { UnSelectSeatService } from './unSelectSeat.service';
import { JwtAuthGuard } from 'src/shared/guard/jwt-auth.guard';
import { UnSelectSeatResponseDto } from './unSelectSeat-response.dto';

@ApiTags('Booking Service - Booking')
@Controller('api/booking')
export class UnSelectSeatController {
  constructor(private readonly unSelectSeatService: UnSelectSeatService) {}

  @UseGuards(JwtAuthGuard)
  @Delete('/unSelectSeat/:showingId')
    @ApiBearerAuth('access-token')

  @ApiOperation({ summary: 'Unselect seats' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Seats successfully unselected',
    type: UnSelectSeatResponseDto
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Seats not found or not selected',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Internal server error',
  })
  async unSelectSeat(
    @Request() req,
    @Param('showingId') showingId: string, // ✅ Sửa lại @Param()
    @Res() res: Response
  ) {
    const user = req.user;
    
    try {
      const result = await this.unSelectSeatService.execute(showingId, user.email);

      if (result.isErr()) {
        const error = result.unwrapErr();
        return res
          .status(HttpStatus.NOT_FOUND)
          .json(ErrorHandler.notFound(error.message)); // ✅ Trả về 404 nếu không tìm thấy ghế
      }

      return res.status(HttpStatus.OK).json({
        statusCode: HttpStatus.OK,
        message: 'Seats successfully unselected',
        data: result.unwrap(),
      });
    } catch (error) {
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json(ErrorHandler.internalServerError(error.message));
    }
  }
}
