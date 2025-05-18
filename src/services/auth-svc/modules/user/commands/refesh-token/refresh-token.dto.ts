import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class RefreshTokenDto {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'Refresh token for generating new access token'
  })
  @IsNotEmpty()
  @IsString()
  refresh_token: string;
}

class RefreshTokenResponseData {
  @ApiProperty({
    description: 'New JWT access token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
  })
  access_token: string;

  @ApiProperty({
    description: 'New JWT refresh token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
  })
  refresh_token: string;
}

export class RefreshTokenResponse {
  @ApiProperty({ example: 200 })
  statusCode: number;

  @ApiProperty({ 
    example: 'Token refreshed successfully',
    description: 'Success message'
  })
  message: string;

  @ApiProperty({
    type: RefreshTokenResponseData
  })
  data: RefreshTokenResponseData;
}