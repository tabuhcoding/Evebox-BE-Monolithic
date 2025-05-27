import { ApiProperty } from '@nestjs/swagger';
import { BaseResponse } from 'src/shared/constants/baseResponse';

export class UpdateTicketTypeResponseDto extends BaseResponse {
  @ApiProperty({ example: '1', description: 'Updated ticketType id' })
  ticketTypeId: string;
}