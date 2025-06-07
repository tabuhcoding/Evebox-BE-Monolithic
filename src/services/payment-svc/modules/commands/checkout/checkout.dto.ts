import { ApiProperty } from "@nestjs/swagger";
import { IsString } from "class-validator";
import { PaymentMethod } from "src/services/payment-svc/repository/paymentMethodStatus/paymentMethodStatus.repo";
export class CheckoutDto {
  @ApiProperty({ example: "1d351350849f4af295232eeb39d2fdd8", description: 'Show ID' })
  @IsString()
  showingID: string;

  @ApiProperty({ example: PaymentMethod.PAYOS, description: 'Payment method name' })
  @IsString()
  paymentMethod: PaymentMethod;

  @ApiProperty({ example: "localhost:3000/payment-success", description: 'User ID' })
  @IsString()
  paymentSuccessUrl: string;

  @ApiProperty({ example: "localhost:3000/payment-cancel", description: 'User ID' })
  @IsString()
  paymentCancelUrl: string;
}