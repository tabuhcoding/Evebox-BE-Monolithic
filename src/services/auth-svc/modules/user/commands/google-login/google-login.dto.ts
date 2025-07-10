import { ApiProperty } from "@nestjs/swagger";

export class GoogleSigninDto {
  @ApiProperty({
    example: 'john@gmail.com',
    description: 'User\'s email from Google'
  })
  email: string;

  @ApiProperty({
    example: 'John Doe',
    description: 'User\'s full name from Google'
  })
  name: string;

  @ApiProperty({
    example: '1234567890',
    description: 'Google user ID'
  })
  googleId: string;

  @ApiProperty({
    example: 'https://lh3.googleusercontent.com/a/avatar',
    description: 'Google profile avatar URL',
    required: false
  })
  avatar?: string;

  @ApiProperty({
    example: 'ya29.a0AfH6SMC...',
    description: 'Google access token'
  })
  accessToken: string;
}

/* export class GoogleLoginDto {
  @ApiProperty({
    example: 'John Doe',
    description: 'User\'s full name from Google'
  })
  fullname: string;

  @ApiProperty({
    example: 'johndoe',
    description: 'Username from Google'
  })
  username: string;

  @ApiProperty({
    example: 'john@gmail.com',
    description: 'User\'s email from Google'
  })
  email: string;

  @ApiProperty({
    example: 'https://lh3.googleusercontent.com/a/avatar',
    description: 'Google profile avatar URL'
  })
  avatar: string;
  } */
  
  class GoogleLoginResponseData {
    @ApiProperty({
      description: 'User ID',
      example: '123e4567-e89b-12d3-a456-426614174000'
    })
    id: string;

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
  
  // Response Schema
  export class GoogleLoginResponse {
    @ApiProperty({ example: 200 })
    statusCode: number;
  
    @ApiProperty({ 
      example: 'User logged in successfully',
      description: 'Success message'
    })
    message: string;
  
    @ApiProperty({
      type: GoogleLoginResponseData
    })
    data: GoogleLoginResponseData;
  }