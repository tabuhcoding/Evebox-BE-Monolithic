import { ApiProperty } from '@nestjs/swagger';
import { BaseResponse } from 'src/shared/constants/baseResponse';

export class UpdateEventMemberResponseDto extends BaseResponse {
  @ApiProperty({
    example: {
      eventId: 1,
      userId: 'abc123',
      email: 'user@example.com',
      role: 3,
      role_desc: 'manager',
      createdAt: '2025-04-12T10:00:00.000Z',
    },
  })
  data: {
    eventId: number;
    userId: string;
    email: string;
    role: number;
    role_desc: string;
    createdAt: Date;
  };
}
