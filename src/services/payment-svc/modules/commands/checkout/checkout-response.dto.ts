import { ApiProperty } from '@nestjs/swagger';
import { BaseResponse } from 'src/shared/constants/baseResponse';

type CheckoutType = 'REGISTER' | 'BOOKING'

export class CheckoutResponseData {
  @ApiProperty({
    example: "https://pay.payos.vn/web/1d351350849f4af295232eeb39d2fdd8",
    description: 'Payment Link',
  })
  paymentLink?: string;

  @ApiProperty({
    example: "1d351350849f4af295232eeb39d2fdd8",
    description: 'Order Code',
  })
  orderCode?: string;

  @ApiProperty({
    example: "REGISTER",
    description: 'Checkout Type',
  })
  checkoutType: CheckoutType;
}

export class CheckoutResponseDto extends BaseResponse {
  @ApiProperty({ type: CheckoutResponseData, description: 'Response data' })
  data: CheckoutResponseData;
}
