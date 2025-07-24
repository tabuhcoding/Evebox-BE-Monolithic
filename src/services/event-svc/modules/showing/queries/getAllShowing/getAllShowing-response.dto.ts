import { ApiProperty } from '@nestjs/swagger';
import { SeatStatus, SeatStatusEnum } from 'src/services/event-svc/repository/seatStatus/seatStatus.repo';

export class AllShowingsResponseDto {
  @ApiProperty({ example: 200, description: 'Response status code' })
  statusCode: number;

  @ApiProperty({
    example: 'Showing data retrieved successfully',
    description: 'Response message',
  })
  message: string;

  @ApiProperty({
    example: '16962844867169,16962844867170',
    description: 'Comma-separated string of Showing IDs',
  })
  data: {
    showingIds: string[];
  };
}

export class TicketTypeSectionMapDto {
  @ApiProperty({
    example: '16962844867171',
    description: 'TicketType ID',
  })
  ticketTypeId?: string;

  @ApiProperty({
    example: 23456,
    description: 'Section IDs',
  })
  sectionId: number;

  @ApiProperty({
    example: 30,
    description: 'Number of seats in the section',
  })
  quantity?: number;
}

export class ConnectShowingToSeatmapDTO {
  @ApiProperty({ example: '16962844867169', description: 'Showing ID' })
  showingId: string;

  @ApiProperty({ example: 123, description: 'Seatmap ID' })
  seatmapId: number;

  @ApiProperty({
    type: [TicketTypeSectionMapDto],
    description: 'Map of ticket types to section IDs and quantities',
  })
  ticketTypeSectionMap: TicketTypeSectionMapDto[];

  @ApiProperty({
    example: { 16962844867171:  'AVAILABLE'},
    description: 'Ticket Type Section Map',
  })
  seatStatusMap?: Record<number, SeatStatusEnum>;
}