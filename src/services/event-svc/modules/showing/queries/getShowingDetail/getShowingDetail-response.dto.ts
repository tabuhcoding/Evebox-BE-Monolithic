import { ApiProperty } from '@nestjs/swagger';
import { TicketTypeStatus } from 'src/services/event-svc/repository/ticketType/ticketType.repo';
import { ShowingStatus } from 'src/shared/utils/status/status';

export class TicketTypeDto {
  @ApiProperty({ example: '1030527' })
  id: string;

  @ApiProperty({ example: 'THƯỜNG' })
  name: string;

  @ApiProperty({ example: '', description: 'Description of the ticket type' })
  description: string;

  @ApiProperty({ example: '#86f0ff' })
  color: string;

  @ApiProperty({ example: false })
  isFree: boolean;

  @ApiProperty({ example: 330000 })
  price: number;

  @ApiProperty({ example: 330000 })
  originalPrice: number;

  @ApiProperty({ example: 10 })
  maxQtyPerOrder: number;

  @ApiProperty({ example: 1 })
  minQtyPerOrder: number;

  @ApiProperty({ example: '2024-12-14T03:00:00.000Z' })
  startTime: Date;

  @ApiProperty({ example: '2024-12-27T12:30:00.000Z' })
  endTime: Date;

  @ApiProperty({ example: 1 })
  position: number;

  @ApiProperty({ example: TicketTypeStatus.BOOK_NOW })
  status: TicketTypeStatus;

  @ApiProperty({ example: '' })
  imageUrl: string;

  @ApiProperty({ example: false })
  isHidden: boolean;
}

class EventDto {
  @ApiProperty({ example: 22911, description: 'Event ID' })
  id: number;

  @ApiProperty({
    example: 'SÂN KHẤU / ĐOÀN CẢI LƯƠNG THIÊN LONG - CAO QUÂN BẢO ĐẠI CHIẾN DƯ HỒNG (LƯU KIM ĐÍNH)',
    description: 'Event title',
  })
  title: string;

  @ApiProperty({ example: 'https://example.com/poster.jpg', description: 'Image poster URL' })
  imgPosterUrl: string;

  @ApiProperty({ example: 'https://example.com/logo.jpg', description: 'Image logo URL' })
  imgLogoUrl: string;

  @ApiProperty({ example: 'Nhà hát cải lương', description: 'Event venue' })
  venue: string;

}

export class ShowingDataDto {
  @ApiProperty({ example: '1041811243642', description: 'Showing ID' })
  id: string;

  @ApiProperty({ example: 22911, description: 'Event ID' })
  eventId: number;

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

  @ApiProperty({ type: EventDto, description: 'Event details' })
  Events: EventDto;

  @ApiProperty({ type: [TicketTypeDto], description: 'List of available ticket types' })
  TicketType: TicketTypeDto[];

  @ApiProperty({ example: ShowingStatus.BOOK_NOW, description: 'Showing status' })
  status: ShowingStatus;

  @ApiProperty({ example: 0, description: 'Minimum price of the ticket types' })
  minPrice: number;
}

export class ShowingResponseDto {
  @ApiProperty({ example: 200, description: 'Response status code' })
  statusCode: number;

  @ApiProperty({
    example: 'Showing data retrieved successfully',
    description: 'Response message',
  })
  message: string;

  @ApiProperty({ type: ShowingDataDto, description: 'Showing data' })
  data: ShowingDataDto;
}