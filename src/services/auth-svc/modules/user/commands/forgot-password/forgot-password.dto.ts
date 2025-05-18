import { ApiProperty } from '@nestjs/swagger';
import { IsEmail} from 'class-validator';

export class ForgotPasswordUserDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'Email address for password reset'
  })

  @IsEmail()
  email: string;
}

class ForgotPasswordResponseData {
  @ApiProperty({
    description: 'Request token for OTP verification',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
  })
  request_token: string;

  @ApiProperty({
    description: 'Number of attempts remaining',
    example: 5
  })
  remaining_attempts: number;

  @ApiProperty({
    description: 'Time remaining until next resend allowed (in seconds)',
    example: 60
  })
  resend_allowed_in: number;
}

export class ForgotPasswordResponse {
  @ApiProperty({ example: 200 })
  statusCode: number;

  @ApiProperty({ 
    example: 'OTP has been sent to your email',
    description: 'Success message'
  })
  message: string;

  @ApiProperty({
    type: ForgotPasswordResponseData
  })
  data: ForgotPasswordResponseData;
}
