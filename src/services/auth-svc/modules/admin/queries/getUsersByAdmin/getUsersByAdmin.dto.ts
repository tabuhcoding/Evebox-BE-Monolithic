import { ApiProperty } from "@nestjs/swagger";
import { PaginationQuery } from "src/shared/constants/pagination";
import { UserStatus } from "@prisma/client";

export class GetUsersByAdminDto extends PaginationQuery {
  @ApiProperty({ example: 'Dat Truong', description: 'User name', required: false })
  search?: string;

  @ApiProperty({
    example: '2024-12-28T13:00:00.000Z',
    description: 'Filter users created after this date',
    required: false,
    type: String,
  })
  createdFrom?: string;

  @ApiProperty({
    example: '2024-12-28T13:00:00.000Z',
    description: 'Filter users created before this date',
    required: false,
    type: String,
  })
  createdTo?: string;

  @ApiProperty({ example: UserStatus.ACTIVE, description: 'Filter users by user status', required: false })
  status?: string;
}