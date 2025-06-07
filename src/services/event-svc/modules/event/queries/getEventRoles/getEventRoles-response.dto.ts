import { ApiProperty } from '@nestjs/swagger';
import { BaseResponse } from 'src/shared/constants/baseResponse';

export class EventRoleItemDto {
  @ApiProperty({ example: 0, description: 'Role ID (0 = Organizer, 1 = Admin, etc.)' })
  role: number;

  @ApiProperty({ example: true })
  isEdited: boolean;

  @ApiProperty({ example: true })
  isSummarized: boolean;

  @ApiProperty({ example: true })
  viewVoucher: boolean;

  @ApiProperty({ example: false })
  marketing: boolean;

  @ApiProperty({ example: true })
  viewOrder: boolean;

  @ApiProperty({ example: false })
  viewSeatmap: boolean;

  @ApiProperty({ example: true })
  viewMember: boolean;

  @ApiProperty({ example: true })
  checkin: boolean;

  @ApiProperty({ example: false })
  checkout: boolean;

  @ApiProperty({ example: false })
  redeem: boolean;
}

export class GetEventRolesResponseDto extends BaseResponse {
  @ApiProperty({
    type: [EventRoleItemDto],
    description: 'List of all available roles and their permissions',
  })
  data: EventRoleItemDto[];
}