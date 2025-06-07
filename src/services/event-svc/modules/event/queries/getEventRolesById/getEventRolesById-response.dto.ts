import { ApiProperty } from '@nestjs/swagger';
import { BaseResponse } from 'src/shared/constants/baseResponse';

export class EventRoleDetailDto {
  @ApiProperty({ example: 1, description: 'Role ID' })
  id: number;

  @ApiProperty({ example: true })
  isEdited: boolean;

  @ApiProperty({ example: true })
  isSummarized: boolean;

  @ApiProperty({ example: true })
  viewVoucher: boolean;

  @ApiProperty({ example: true })
  marketing: boolean;

  @ApiProperty({ example: true })
  viewOrder: boolean;

  @ApiProperty({ example: true })
  viewSeatmap: boolean;

  @ApiProperty({ example: true })
  viewMember: boolean;

  @ApiProperty({ example: true })
  checkin: boolean;

  @ApiProperty({ example: true })
  checkout: boolean;

  @ApiProperty({ example: true })
  redeem: boolean;
}

export class GetEventRoleByIdResponseDto extends BaseResponse {
  @ApiProperty({ type: EventRoleDetailDto })
  data: EventRoleDetailDto;
}