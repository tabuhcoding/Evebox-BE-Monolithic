import { ApiProperty } from '@nestjs/swagger';

export class TicketTypeDto {
  @ApiProperty({ example: 'vip-001', description: 'Ticket Type ID' })
  id: string;

  @ApiProperty({ example: 'VIP Ticket', description: 'Name of ticket type' })
  name: string;

  @ApiProperty({ example: 'Front row seats', description: 'Ticket description' })
  description: string;

  @ApiProperty({ example: '#FF5733', description: 'Color used to display ticket type' })
  color: string;

  @ApiProperty({ example: true, description: 'Whether the ticket is free' })
  isFree: boolean;

  @ApiProperty({ example: 500000, description: 'Original price of the ticket' })
  originalPrice: number;

  @ApiProperty({ example: '2024-12-01T18:00:00.000Z', description: 'Start time of ticket sale' })
  startTime: Date;

  @ApiProperty({ example: '2024-12-15T18:00:00.000Z', description: 'End time of ticket sale' })
  endTime: Date;

  @ApiProperty({ example: 1, description: 'Position of the ticket type in display order' })
  position: number;

  @ApiProperty({ example: 100, description: 'Total available quantity' })
  quantity: number;

  @ApiProperty({ example: 5, description: 'Maximum quantity per order' })
  maxQtyPerOrder: number;

  @ApiProperty({ example: 1, description: 'Minimum quantity per order' })
  minQtyPerOrder: number;

  @ApiProperty({ example: 'https://example.com/image.jpg', description: 'Image URL of ticket type' })
  imageUrl: string;

  @ApiProperty({ example: false, description: 'Whether the ticket is hidden' })
  isHidden: boolean;
}

export class ShowingDetailDto {
  @ApiProperty({ example: 'showing-123', description: 'Showing ID' })
  id: string;

  @ApiProperty({ example: '2024-12-20T20:00:00.000Z', description: 'Start time of the showing' })
  startTime: Date;

  @ApiProperty({ example: '2024-12-20T22:00:00.000Z', description: 'End time of the showing' })
  endTime: Date;

  @ApiProperty({ example: 101, description: 'Associated Event ID' })
  eventId: number;

  @ApiProperty({ example: 3, description: 'Associated Seat Map ID' })
  seatMapId: number;

  @ApiProperty({ type: [TicketTypeDto], description: 'List of ticket types for the showing' })
  TicketType: TicketTypeDto[];
}

export class GetAllShowingDetailOfEventResponseDto {
  @ApiProperty({ example: 200 })
  statusCode: number;

  @ApiProperty({ example: 'Get all showing of Event of Organizer successfully' })
  message: string;

  @ApiProperty({ type: [ShowingDetailDto] })
  data: ShowingDetailDto[];
}
