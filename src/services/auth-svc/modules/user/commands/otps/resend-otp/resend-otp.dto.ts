import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { OTPType } from '../../../domain/enums/otp-type.enum';

// Request DTO
export class ResendOTPDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ enum: OTPType })
  @IsEnum(OTPType)
  type: OTPType;

  @ApiProperty({ example: 'token123' })
  @IsString()
  @IsNotEmpty()
  request_token: string;
}

// Response Schema
export class ResendOTPResponse {
  @ApiProperty({ example: 200 })
  statusCode: number;

  @ApiProperty({ 
    example: 'OTP resent successfully',
    description: 'Success message'
  })
  message: string;

  @ApiProperty({
    example: {
      remaining_attempts: 3,
      resend_allowed_in: 300
    },
    description: 'OTP details'
  })
  data: {
    remaining_attempts: number;
    resend_allowed_in: number;
  };
}