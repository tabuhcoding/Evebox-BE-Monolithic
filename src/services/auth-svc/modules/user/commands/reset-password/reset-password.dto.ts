import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength, Matches } from 'class-validator';

export class ResetPasswordDto {
  @ApiProperty({
    description: 'Reset token received after OTP verification',
    example: 'user@example.com_1234567890'
  })
  @IsString()
  resetToken: string;

  @ApiProperty({
    description: 'New password',
    example: 'NewPass123!'
  })
  @IsString()
  @MinLength(8)
  @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message: 'Password must contain uppercase, lowercase, number/special character'
  })
  newPassword: string;

  @ApiProperty({
    description: 'Confirm new password',
    example: 'NewPass123!'
  })
  @IsString()
  confirmPassword: string;
}

export class ResetPasswordResponse {
  @ApiProperty({ example: 200 })
  statusCode: number;

  @ApiProperty({ 
    example: 'Password has been reset successfully',
    description: 'Success message'
  })
  message: string;

  @ApiProperty({ 
    type: 'object',
    properties: {},
    nullable: true,
    default: null
  })
  data: null;
}