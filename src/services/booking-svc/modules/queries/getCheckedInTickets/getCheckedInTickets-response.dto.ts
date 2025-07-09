import { ApiProperty } from '@nestjs/swagger';
import { BaseResponse } from 'src/shared/constants/baseResponse';

export class CheckedInTicketDto {
  @ApiProperty()
  order_id: string;

  @ApiProperty()
  ticket_id: string;

  @ApiProperty()
  startTime: Date;

  @ApiProperty()
  endTime: Date;

  @ApiProperty()
  venue: string;

  @ApiProperty({ enum: ['PHYSICAL_TICKET', 'E_TICKET'] })
  deliveryType: 'PHYSICAL_TICKET' | 'E_TICKET';
}

export class GetCheckedInTicketsResponseDto extends BaseResponse {
  @ApiProperty({ type: [CheckedInTicketDto] })
  data: CheckedInTicketDto[];
}
