import { ApiProperty } from '@nestjs/swagger';

import { PaymentMethod } from 'src/services/payment-svc/repository/paymentMethodStatus/paymentMethodStatus.repo'
import { BaseResponse } from 'src/shared/constants/baseResponse';

export class getPaymentMethodResponseData {
  @ApiProperty({
    example: PaymentMethod.PAYOS,
    description: 'Payment method name',
    enum: PaymentMethod,
  })
  paymentMethod: PaymentMethod;

  @ApiProperty({
    example: 'true',
    description: 'Is payment method enabled',
  })
  status: boolean;
}

export class getPaymentMethodResponseDto extends BaseResponse {
  @ApiProperty({ type: getPaymentMethodResponseData, description: 'Payment Method'})
  paymentMethod: getPaymentMethodResponseData[];
}