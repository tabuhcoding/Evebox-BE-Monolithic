import { ApiProperty } from "@nestjs/swagger";
import { VerifyPinData } from "src/services/auth-svc/modules/user/commands/verift-pin/verify-pin.dto";
import { BaseResponse } from "src/shared/constants/baseResponse";

class GetTicketQrCodeData {
  @ApiProperty({
    example: 'asdahkjdhaskjdhaskjdhkashdkasjdhasd',
    description: 'QR code data for the ticket'
  })
  qrCode: string;

  @ApiProperty({ type: VerifyPinData, description: 'The pin verification data' })
  pinVerification: VerifyPinData;
}

export class GetTicketQrCodeResponse extends BaseResponse{
  @ApiProperty({ type: GetTicketQrCodeData, description: 'The data of the ticket QR code'})
  data: GetTicketQrCodeData;
}