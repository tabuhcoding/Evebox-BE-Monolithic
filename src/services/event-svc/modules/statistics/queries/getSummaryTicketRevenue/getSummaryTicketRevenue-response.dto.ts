import { ApiProperty } from '@nestjs/swagger';
import { BaseResponse } from 'src/shared/constants/baseResponse';

export class TicketTypeSummary {
  @ApiProperty({ example: 'Standard type', description: 'Name of ticket type' })
  typeName: string;

  @ApiProperty({ example: 250000, description: 'Ticket price' })
  price: number;

  @ApiProperty({ example: 120, description: 'Sold amount' })
  sold: number;

  @ApiProperty({ example: 0.8, description: 'Sold ratio' })
  ratio: number;
}

export class SummaryTicketRevenueData {
  @ApiProperty({ example: 101, description: 'Event id' })
  eventId: number;

  @ApiProperty({ example: 'Đêm nhạc Acoustic 2025', description: 'Event title' })
  eventTitle: string;

  @ApiProperty({ example: '1041811243642', description: 'Showing time ID' })
  showingId: string;

  @ApiProperty({ example: '2024-12-28T13:00:00.000Z', description: 'Start time of the showing' })
  startTime: Date;

  @ApiProperty({ example: '2024-12-28T15:00:00.000Z', description: 'End time of the showing' })
  endTime: Date;

  @ApiProperty({ example: 20000000, description: 'Total revenue' })
  totalRevenue: number;

  @ApiProperty({ example: 200, description: 'Total sold ticket' })
  ticketsSold: number;

  @ApiProperty({ example: 300, description: 'Total available ticket' })
  totalTickets: number;

  @ApiProperty({ example: 0.66, description: 'Sold ticket percentage' })
  percentageSold: number;

  @ApiProperty({ type: [TicketTypeSummary], description: 'Each ticket type detail' })
  byTicketType: TicketTypeSummary[];
}

export class SummaryTicketRevenueResponseDto extends BaseResponse {
  @ApiProperty({ type: SummaryTicketRevenueData })
  data: SummaryTicketRevenueData;
}