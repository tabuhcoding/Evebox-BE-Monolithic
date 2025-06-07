import { ApiProperty } from '@nestjs/swagger';
import { BaseResponse } from 'src/shared/constants/baseResponse';

// Định nghĩa DTO cho TicketType
export class TicketTypeData {
  @ApiProperty({ example: '11805', description: 'Ticket ID' })
  id: string;

  @ApiProperty({ example: 'VIP', description: 'Ticket name' })
  name: string;

  @ApiProperty({
    example: '2024-12-28T13:00:00.000Z',
    description: 'Start time of the showing in ISO format',
  })
  startTime: Date;

  @ApiProperty({
    example: '2024-12-28T16:00:00.000Z',
    description: 'End time of the showing in ISO format',
  })
  endTime: Date;

  @ApiProperty({ example: 'Đây là vé VIP', description: 'Ticket description' })
  description: string;

  @ApiProperty({ example: 350000, description: 'Price of the ticket' })
  price: number;

  @ApiProperty({ example: 10, description: 'Max quantity per order' })
  maxQtyPerOrder: number;

  @ApiProperty({ example: 1, description: 'Min quantity per order' })
  minQtyPerOrder: number;

  @ApiProperty({ example: 100, description: 'Total quantity of this ticket type' })
  quantity: number;

  @ApiProperty({ example: 80, description: 'Number of sold tickets' })
  sold: number;

  @ApiProperty({ example: 'book_now', description: 'Ticket status' })
  status: string;

  @ApiProperty({ example: 'https://image.url', description: 'Ticket image URL' })
  imageUrl: string;
}

class EventData {
  @ApiProperty({ example: 86266, description: 'Event ID' })
  id: number;

  @ApiProperty({ example: 'Táo Marcom 2023 - Đón bão', description: 'Event title' })
  title: string;
}

export class TicketTypeDetailData {
  @ApiProperty({ example: 'showing-86266-0', description: 'Showing ID' })
  id: string;

  @ApiProperty({ type: EventData, description: 'Event data' })
  event: EventData;

  @ApiProperty({ example: '2023-01-04T10:30:00.000Z', description: 'Start time of the showing' })
  startTime: Date;

  @ApiProperty({ example: '2023-01-04T14:30:00.000Z', description: 'End time of the showing' })
  endTime: Date;

  @ApiProperty({ type: TicketTypeData, description: 'Ticket type details' })
  ticketType: TicketTypeData;
}

export class TicketTypeDetailResponseDto extends BaseResponse {
  @ApiProperty({ type: TicketTypeDetailData, description: 'Ticket type detail data' })
  data: TicketTypeDetailData
}