import { Controller, Get, Query, Res, HttpStatus, UseGuards, Request } from '@nestjs/common';
import { Response } from 'express';
import { ApiHeader, ApiOperation, ApiQuery, ApiResponse, ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ErrorHandler } from 'src/shared/exceptions/error.handler';
import { JwtAuthGuard } from 'src/shared/guard/jwt-auth.guard';
import { GetUserOrderService } from './getUserOrder.service';
import { GetUserTicketResponseDto } from './getUserOrder-response.dto';
import { GetUserOrderDto, OrderStatus, OrderTimeStamp } from './getUserOrder.dto';
import { VerifyUserPinService } from 'src/services/auth-svc/modules/user/commands/verift-pin/verify-pin.service';
import { VerifyUserPinCommand } from 'src/services/auth-svc/modules/user/commands/verift-pin/verify-pin.command';

@ApiTags('Booking Service - Booking')
@Controller('api/ticket')
export class GetUserOrderController {
  constructor(
    private readonly getUserOrderService: GetUserOrderService,
  ) {}

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
    @Res() res: Response,
    @Query() body: GetUserOrderDto,
  ) {
    const email = req.user.email;

    const result = await this.getUserOrderService.execute( 
      email,
      body.status || null,
      body.timeStamp || OrderTimeStamp.UPCOMING,
      {
        limit: body?.limit >> 0 || 10,
        page: body?.page >> 0 || 1
      },
      body.title || null
    );
    if (result.isErr()) {
      return res
        .status(HttpStatus.BAD_REQUEST)
        .json(ErrorHandler.badRequest(result.unwrapErr().message));
    }

    const data = result.unwrap();
    return res.status(HttpStatus.OK).json({
      statusCode: HttpStatus.OK,
      message: 'Ticket data retrieved successfully',
      data: data[0],
      pagination: data[1],
    });
  }

  @UseGuards(JwtAuthGuard)
  @Get('org/getOrderById')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get order by orderId' })
  @ApiQuery({ name: 'orderId', required: true, type: Number, description: 'The ID of the order to retrieve' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Order data retrieved successfully',
    type: GetUserTicketResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Internal server error',
  })
  async getOrderByIdAdmin(
    @Query('orderId') orderId: number,
    @Res() res: Response,
  ) {    
    const result = await this.getUserOrderService.executeByOrderIdAdmin(orderId>>0);
    if (result.isErr()) {
      return res
        .status(HttpStatus.BAD_REQUEST)
        .json(ErrorHandler.internalServerError(result.unwrapErr().message));
    }

    const data = result.unwrap();
    return res.status(HttpStatus.OK).json({
      statusCode: HttpStatus.OK,
      message: 'Order data retrieved successfully',
      data
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
      data
    });
  }

  @UseGuards(JwtAuthGuard)
  @Get('/getOrderByOriginalId')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get order by Order number Id. Use for booking step' })
  @ApiQuery({ name: 'orderId', required: true, type: String, description: 'The ID of the order to retrieve' })
  async getOrderByOriginalId(
    @Query('orderId') orderId: string,
    @Res() res: Response,
    @Request() req
  ) {
    const email = req.user.email;

    if (!orderId || isNaN(parseInt(orderId))) {
      return res
        .status(HttpStatus.BAD_REQUEST)
        .json(ErrorHandler.badRequest('Invalid orderId format'));
    }
    
    const result = await this.getUserOrderService.executeByOriginalOrderId(parseInt(orderId), email);
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