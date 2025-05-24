import { ApiProperty } from '@nestjs/swagger';
import { Decimal } from '@prisma/client/runtime/library';
import { TicketTypeStatus } from 'src/services/event-svc/repository/ticketType/ticketType.repo';
import { EventStatus, ShowingStatus } from 'src/shared/utils/status/status';

class TicketTypeDto {
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

export class ShowingDto {
  @ApiProperty({ example: '97930557637546' })
  id: string;

  @ApiProperty({ example: 22691 })
  eventId: number;

  @ApiProperty({ example: ShowingStatus.BOOK_NOW })
  status: ShowingStatus;

  @ApiProperty({ example: false })
  isFree: boolean;

  @ApiProperty({ example: true })
  isSalable: boolean;

  @ApiProperty({ example: false })
  isPresale: boolean;

  @ApiProperty({ example: 39 })
  seatMapId: number;

  @ApiProperty({ example: '2024-12-27T12:30:00.000Z' })
  startTime: Date;

  @ApiProperty({ example: '2024-12-27T15:30:00.000Z' })
  endTime: Date;

  @ApiProperty({ example: false })
  isEnabledQueueWaiting: boolean;

  @ApiProperty({ example: true })
  showAllSeats: boolean;

  @ApiProperty({ type: [TicketTypeDto] })
  TicketType: TicketTypeDto[];
}

class CategoryDto {
  @ApiProperty({ example: 5 })
  id: number;

  @ApiProperty({ example: 'theatersandart' })
  name: string;
}

export class EventDetailResponseDto {
  @ApiProperty({ example: 22691 })
  id: number;

  @ApiProperty({ example: 'SÂN KHẤU THIÊN ĐĂNG : NHỮNG CON MA NHÀ HÁT' })
  title: string;

  @ApiProperty({ example: '<p><strong>&#34;NHỮNG CON MA NHÀ HÁT&#34;</strong></p>...' })
  description: string;

  @ApiProperty({ example: '2024-12-27T12:30:00.000Z' })
  startDate: Date;

  @ApiProperty({ example: null, nullable: true })
  organizerId: string | null;

  @ApiProperty({ example: EventStatus.AVAILABLE })
  status: EventStatus;

  @ApiProperty({ example: 'Sân khấu Thien Dang' })
  venue: string;

  @ApiProperty({ example: 'https://example.com/poster.jpg', description: 'Image poster URL' })
  imgPosterUrl: string;

  @ApiProperty({ example: 'https://example.com/logo.jpg', description: 'Image logo URL' })
  imgLogoUrl: string;

  @ApiProperty({ example: false })
  isOnline: boolean;

  @ApiProperty({ example: '62 Trần Quang Khải, Tan Dinh Ward, 1 District, Ho Chi Minh City' })
  locationsString: string;

  @ApiProperty({ example: '50' })
  lastScore: Decimal;

  @ApiProperty({ example: false })
  isSpecial: boolean;

  @ApiProperty({ example: false })
  isOnlyOnEve: boolean;

  @ApiProperty({ example: "Nha hat kich Idecaf", description: 'Organizer name' })
  orgName: string;

  @ApiProperty({ example: 'Nha hat kich Idecaf', description: 'Organizer description' })
  orgDescription: string;

  @ApiProperty({ type: [CategoryDto] })
  categories: CategoryDto[];

  @ApiProperty({ type: [ShowingDto] })
  showing: ShowingDto[];

  @ApiProperty({ example: 222000, description: 'Min ticket price' })
  minPrice: number;
}

export class EventDetailResponse{
  @ApiProperty({example: 200, description: 'Status code'})
  statusCode: number;

  @ApiProperty({example: 'Event details retrieved successfully', description: 'Message'})
  message: string;

  @ApiProperty({type: EventDetailResponseDto, description: 'Event details'})
  data: EventDetailResponseDto;
}