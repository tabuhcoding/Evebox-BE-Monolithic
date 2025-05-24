import { ApiProperty } from '@nestjs/swagger';

class NotifiedUser {
  @ApiProperty({ example: 'user-uuid-123', description: 'User ID who receives notification' })
  userId: string;
}

export class GetNotifiedUsersResponse {
  @ApiProperty({ type: [NotifiedUser] })
  data: NotifiedUser[];
}
