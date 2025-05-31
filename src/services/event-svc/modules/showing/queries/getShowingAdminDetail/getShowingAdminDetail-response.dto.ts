import { ApiProperty } from '@nestjs/swagger';

class EventDto {
  @ApiProperty({ example: 22911, description: 'Event ID' })
  id: number;

  @ApiProperty({
    example: 'SÂN KHẤU / ĐOÀN CẢI LƯƠNG THIÊN LONG - CAO QUÂN BẢO ĐẠI CHIẾN DƯ HỒNG (LƯU KIM ĐÍNH)',
    description: 'Event title',
  })
  title: string;
}

export class TicketTypeDto {
  @ApiProperty({ example: '1027771', description: 'Ticket ID' })
  id: string;

  @ApiProperty({ example: 'ĐÀO KÉP', description: 'Ticket name' })
  name: string;

  @ApiProperty({ example: '', description: 'Ticket description' })
  description: string;

  @ApiProperty({ example: '#c0fd71', description: 'Ticket color code' })
  color: string;

  @ApiProperty({ example: false, description: 'Is ticket free' })
  isFree: boolean;

  @ApiProperty({ example: 1500000, description: 'Ticket price' })
  price: number;

  @ApiProperty({ example: 1500000, description: 'Original ticket price' })
  originalPrice: number;

  @ApiProperty({ example: 10, description: 'Maximum quantity per order' })
  maxQtyPerOrder: number;

  @ApiProperty({ example: 1, description: 'Minimum quantity per order' })
  minQtyPerOrder: number;

  @ApiProperty({
    example: '2024-10-10T06:28:00.000Z',
    description: 'Effective start date in ISO format',
  })
  startTime: Date;

  @ApiProperty({
    example: '2024-12-21T13:00:00.000Z',
    description: 'Effective end date in ISO format',
  })
  endTime: Date;

  @ApiProperty({ example: 1, description: 'Position in list' })
  position: number;

  @ApiProperty({ example: 'sold_out', description: 'Ticket status' })
  status: string;

  @ApiProperty({ example: '', description: 'Ticket image URL' })
  imageUrl: string;

  @ApiProperty({ example: false, description: 'Is ticket hidden' })
  isHidden: boolean;

  @ApiProperty({ example: 123, description: 'Quantity of ticket type' })
  quantity: number;

  @ApiProperty({ example: 50, description: 'Total sold tickets' })
  sold: number;
}

export class ShowingAdminDataDto {
  @ApiProperty({ example: '1041811243642', description: 'Showing ID' })
  id: string;

  @ApiProperty({ example: 22911, description: 'Event ID' })
  eventId: number;

  @ApiProperty({ example: 'book_now', description: 'Showing status' })
  status: string;

  @ApiProperty({ example: false, description: 'Is the event free' })
  isFree: boolean;

  @ApiProperty({ example: true, description: 'Is ticket salable' })
  isSalable: boolean;

  @ApiProperty({ example: false, description: 'Is presale available' })
  isPresale: boolean;

  @ApiProperty({ example: 180, description: 'Seat map ID' })
  seatMapId: number;

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

  @ApiProperty({ example: false, description: 'Is queue waiting enabled' })
  isEnabledQueueWaiting: boolean;

  @ApiProperty({ example: true, description: 'Show all seats' })
  showAllSeats: boolean;

  @ApiProperty({ type: EventDto, description: 'Event info' })
  event: EventDto;

  @ApiProperty({ type: [TicketTypeDto], description: 'List of available ticket types' })
  ticketTypes: TicketTypeDto[];
}

export class ShowingAdminResponseDto {
  @ApiProperty({ example: 200, description: 'Response status code' })
  statusCode: number;

  @ApiProperty({
    example: 'Showing data retrieved successfully',
    description: 'Response message',
  })
  message: string;

  @ApiProperty({ type: ShowingAdminDataDto, description: 'Showing data' })
  data: ShowingAdminDataDto;
}