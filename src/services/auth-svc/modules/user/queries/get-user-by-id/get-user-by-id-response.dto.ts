import { ApiProperty } from "@nestjs/swagger";
import { BaseResponse } from "src/shared/constants/baseResponse";

export class UserData {
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

  @ApiProperty({
    description: 'Created date of user'
  })
  created_at: Date;
}

export class UserResponseById extends BaseResponse {
  @ApiProperty({ type: UserData, description: 'User data' })
  data: UserData;
}