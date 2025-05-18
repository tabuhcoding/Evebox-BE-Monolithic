import { ApiProperty } from '@nestjs/swagger';
import { ArrayNotEmpty, ArrayUnique, IsArray, IsEmail, IsInt, IsNotEmpty, IsOptional, IsString, Length, MinLength } from 'class-validator';

export class RegisterUserDto {
  @ApiProperty({
    example: 'John Doe',
    description: 'User full name'
  })
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    example: 'john@example.com',
    description: 'User email address'
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: 'password123',
    description: 'User password (min 6 characters)'
  })
  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @ApiProperty({
    example: 'password123',
    description: 'Confirm password'
  })
  @IsNotEmpty()
  @MinLength(6)
  re_password: string;

  @ApiProperty({
    example: '0123456789',
    description: 'Phone number (10 digits)'
  })
  @IsNotEmpty()
  @IsString()
  @Length(10, 10)
  phone: string;

  @ApiProperty({
    example: 2,
    description: 'User role ID'
  })
  @IsInt()
  role_id: number;

  @ApiProperty({
    example: [1, 2, 3],
    description: 'Array of province IDs',
    required: false,
    type: [Number]
  })
  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @ArrayUnique()
  @IsInt({ each: true })
  province_id?: number[];
}

class RegisterResponseData {
  @ApiProperty({
    description: 'Request token for OTP verification',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
  })
  request_token: string;

  @ApiProperty({
    description: 'Number of remaining OTP attempts',
    example: 3
  })
  remaining_attempts: number;

  @ApiProperty({
    description: 'Time until next OTP resend allowed (seconds)',
    example: 300
  })
  resend_allowed_in: number;
}

export class RegisterResponse {
  @ApiProperty({ example: 200 })
  statusCode: number;

  @ApiProperty({ 
    example: 'OTP has been sent to your email',
    description: 'Success message'
  })
  message: string;

  @ApiProperty({
    type: RegisterResponseData
  })
  data: RegisterResponseData;
}