import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, Length, IsEnum } from 'class-validator';
import { OTPType } from '../../../domain/enums/otp-type.enum';

export class VerifyOTPDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'User email address',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: '123456',
    description: 'OTP code (6 digits)',
  })
  @IsString()
  @Length(6, 6)
  otp: string;

  @ApiProperty({
    enum: OTPType,
    example: OTPType.FORGOT_PASSWORD,
    description: 'Type of OTP verification',
  })
  @IsEnum(OTPType)
  type: OTPType;

  @ApiProperty({
    example: 'token',
    description: 'Request token',
  })
  request_token: string;
}

class VerifyOTPResponseData {
  @ApiProperty({
    description: 'Verification token or user ID depending on OTP type',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    required: false,
    nullable: true
  })
  token: string | null;
}

export class VerifyOTPResponse {
  @ApiProperty({ example: 200 })
  statusCode: number;

  @ApiProperty({ 
    example: 'Email verified successfully. You can now complete registration',
    description: 'Success message'
  })
  message: string;

  @ApiProperty({
    type: VerifyOTPResponseData
  })
  data: VerifyOTPResponseData;
}