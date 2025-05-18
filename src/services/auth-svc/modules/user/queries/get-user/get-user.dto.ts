import { ApiProperty } from '@nestjs/swagger';

class UserData {
  @ApiProperty({
    type: 'string',
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'User unique identifier',
  })
  id: string;

  @ApiProperty({
    type: 'string',
    example: 'John Doe',
    description: 'User full name',
  })
  name: string;

  @ApiProperty({
    type: 'string',
    example: 'john@example.com',
    description: 'User email address',
  })
  email: string;

  @ApiProperty({
    type: 'number',
    example: 2,
    description: 'User role ID',
  })
  role: number;

  @ApiProperty({
    type: 'string',
    example: '0123456789',
    description: 'User phone number',
  })
  phone: string;
}

export class UserResponse {
  @ApiProperty({ example: 200 })
  statusCode: number;

  @ApiProperty({
    example: 'User details fetched successfully',
    description: 'Success message',
  })
  message: string;

  @ApiProperty({
    type: () => UserData,
  })
  data: UserData;
}
