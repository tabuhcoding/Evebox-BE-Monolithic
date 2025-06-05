import { ApiProperty } from "@nestjs/swagger";
import { Length } from "class-validator";
import { BaseResponse } from "src/shared/constants/baseResponse";

export class VerifyPinUserDto {
  @ApiProperty({ example: '123456', description: 'Pin code(required exactly 6 number)' })
  @Length(6)
  pin: string;
}

export class VerifyPinData {
  @ApiProperty({ example: true })
  isValid: boolean;
  
  @ApiProperty({ example: 3, required: false })
  remainingAttempts?: number;

  @ApiProperty({ example: '2024-11-20T15:30:00.000Z', required: false })
  lockedUntil?: Date;
}

export class VerifyPinResponse extends BaseResponse {
  @ApiProperty({
    type: () => VerifyPinData,
  })
  data: VerifyPinData;
}