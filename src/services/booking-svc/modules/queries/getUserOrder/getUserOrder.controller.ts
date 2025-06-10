import { Controller, Get, Query, Res, HttpStatus, UseGuards, Request } from '@nestjs/common';
import { Response } from 'express';
import { ApiHeader, ApiOperation, ApiQuery, ApiResponse, ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ErrorHandler } from 'src/shared/exceptions/error.handler';
import { JwtAuthGuard } from 'src/shared/guard/jwt-auth.guard';
import { GetUserTicketService as GetUserOrderService } from './getUserOrder.service';
import { GetUserTicketResponseDto } from './getUserOrder-response.dto';

@ApiTags('Booking Service - Booking')
@Controller('api/ticket')
export class GetUserOrderController {
  constructor(private readonly getUserOrderService: GetUserOrderService) {}

  @UseGuards(JwtAuthGuard)
  @Get('/getUserOrder')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get status of all payment method' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Ticket data retrieved successfully',
    type: GetUserTicketResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Internal server error',
  })
  async getOrders(
    @Request() req,
    @Res() res: Response) {
    const email = req.user.email;
    // const email = 'dattruong01082@gmail.com';
    const result = await this.getUserOrderService.execute( email);
    if (result.isErr()) {
      return res
        .status(HttpStatus.BAD_REQUEST)
        .json(ErrorHandler.internalServerError(result.unwrapErr().message));
    }

    const data = result.unwrap();
    return res.status(HttpStatus.OK).json({
      statusCode: HttpStatus.OK,
      message: 'Ticket data retrieved successfully',
      data,
    });
  }

  @UseGuards(JwtAuthGuard)
  @Get('/getOrderById')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get order by orderId' })
  @ApiQuery({ name: 'orderId', required: true, type: String, description: 'The ID of the order to retrieve' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Order data retrieved successfully',
    type: GetUserTicketResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Internal server error',
  })
  async getOrderById(
    @Query('orderId') orderId: string,
    @Res() res: Response,
    @Request() req
  ) {
    const email = req.user.email;
    
    const result = await this.getUserOrderService.executeByOrderId(orderId, email);
    if (result.isErr()) {
      return res
        .status(HttpStatus.BAD_REQUEST)
        .json(ErrorHandler.internalServerError(result.unwrapErr().message));
    }

    const data = result.unwrap();
    return res.status(HttpStatus.OK).json({
      statusCode: HttpStatus.OK,
      message: 'Order data retrieved successfully',
      data,
    });
  }
}