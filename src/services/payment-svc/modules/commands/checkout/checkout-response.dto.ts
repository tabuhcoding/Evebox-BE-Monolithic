import { ApiProperty } from '@nestjs/swagger';
import { BaseResponse } from 'src/shared/constants/baseResponse';

export class CheckoutResponseData {
  @ApiProperty({
    example: "https://pay.payos.vn/web/1d351350849f4af295232eeb39d2fdd8",
    description: 'Payment Link',
  })
  paymentLink: string;
}

export class CheckoutResponseDto extends BaseResponse {
  @ApiProperty({ type: CheckoutResponseData, description: 'Response data' })
  data: CheckoutResponseData;
}
