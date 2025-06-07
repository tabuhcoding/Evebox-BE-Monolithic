import { Controller, Get, Query, Res, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ErrorHandler } from 'src/shared/exceptions/error.handler';
import { getPaymentMethodResponseDto } from './getPaymentMethod-response.dto';
import { getPaymentMethodService } from './getPaymentMethod.service';

@ApiTags('Payment')
@Controller('api/payment')
export class getPaymentMethodController {
  constructor(private readonly getPaymentMethodService: getPaymentMethodService) {}

  @Get('/getPaymentMethodStatus')
  @ApiOperation({ summary: 'Get status of all payment method' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Payment method status data retrieved successfully',
    type: getPaymentMethodResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Payment method data not found',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Error not found',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Internal server error',
  })
  async getShowing(@Res() res: Response) {
    const result = await this.getPaymentMethodService.execute();

    if (result.isErr()) {
      const error = result.unwrapErr();
      return res
        .status(error.message === "PaymentMethod not found." ? HttpStatus.NOT_FOUND : HttpStatus.BAD_REQUEST)
        .json(error.message === "PaymentMethod not found." ? ErrorHandler.notFound(result.unwrapErr().message) : ErrorHandler.badRequest(result.unwrapErr().message));
    }

    const data = result.unwrap();
    return res.status(HttpStatus.OK).json({
      statusCode: HttpStatus.OK,
      message: 'Payment Method status data retrieved successfully',
      data,
    });
  }
}