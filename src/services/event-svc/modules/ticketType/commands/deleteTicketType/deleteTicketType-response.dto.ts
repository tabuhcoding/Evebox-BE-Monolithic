import { ApiProperty } from '@nestjs/swagger';
import { BaseResponse } from 'src/shared/constants/baseResponse';

export class DeleteTicketTypeResponseDto extends BaseResponse {
  @ApiProperty({ example: '1', description: 'Deleted ticket type id' })
  ticketTypeId: string;
}