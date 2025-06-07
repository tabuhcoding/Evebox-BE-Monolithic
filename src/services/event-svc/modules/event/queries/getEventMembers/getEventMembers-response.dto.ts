import { ApiProperty } from '@nestjs/swagger';
import { BaseResponse } from 'src/shared/constants/baseResponse';

export class GetEventMembersResponseDto extends BaseResponse {
  @ApiProperty({
    example: [
      {
        eventId: 1,
        userId: 'abc123',
        email: 'user@example.com',
        role: 4,
        role_desc: 'check-in staff',
        createdAt: '2025-04-12T10:00:00.000Z',
        updatedAt: '2025-04-12T11:00:00.000Z',
        isDeleted: false,
      },
    ],
  })
  data: {
    eventId: number;
    userId: string;
    email: string;
    role: number;
    role_desc: string;
    createdAt: Date;
    updatedAt: Date;
    isDeleted: boolean;
  }[];
}
