import { ApiProperty } from "@nestjs/swagger";
import { PaginationQuery } from "src/shared/constants/pagination";

export class GetEventsAdminDto extends PaginationQuery {
  @ApiProperty({
    example: 'Kịch idecaf',
    description: 'Filter events by title',
    required: false,
  })
  title?: string;

  @ApiProperty({
    example: true,
    description: 'Filter events by approval status',
    required: false,
    type: Boolean,
  })
  isApproved?: boolean;

  @ApiProperty({
    example: true,
    description: 'Filter events by deletion status',
    required: false,
    type: Boolean,
  })
  isDeleted?: boolean;

  @ApiProperty({
    example: 1,
    description: 'Category of event',
    required: false,
    type: Number
  })
  categoryId: number;

  @ApiProperty({
    example: '2024-12-28T13:00:00.000Z',
    description: 'Filter events created after this date',
    required: false,
    type: String,
  })
  createdFrom?: string;

  @ApiProperty({
    example: '2024-12-28T13:00:00.000Z',
    description: 'Filter events created before this date',
    required: false,
    type: String,
  })
  createdTo?: string;

  @ApiProperty({
    example: 'dattruong01082@gmail.com',
    description: 'Filter events is managed by this admin',
    required: false,
    type: String,
  })
  admin?: string;
}
  