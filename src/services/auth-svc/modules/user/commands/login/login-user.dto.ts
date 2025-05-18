import { IsEmail, IsNotEmpty, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginUserDto {
  @ApiProperty({
    example: 'user@example.com',
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
}

class LoginResponseData {
  @ApiProperty({
    description: 'JWT access token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
  })
  access_token: string;

  @ApiProperty({
    description: 'JWT refresh token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
  })
  refresh_token: string;
}

export class LoginResponse {
  @ApiProperty({ example: 200 })
  statusCode: number;

  @ApiProperty({ 
    example: 'Login successful',
    description: 'Success message'
  })
  message: string;

  @ApiProperty({
    type: LoginResponseData
  })
  data: LoginResponseData;
}