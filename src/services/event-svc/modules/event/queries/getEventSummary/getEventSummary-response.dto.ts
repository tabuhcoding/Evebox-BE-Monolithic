import { ApiProperty } from '@nestjs/swagger';
import { BaseResponse } from 'src/shared/constants/baseResponse';

export class RevenueChart {
  @ApiProperty({ example: '2024-04-01', description: 'Date (format YYYY-MM-DD)' })
  date: string;

  @ApiProperty({ example: 123, description: 'Revenue generated on this date' })
  revenue: number;

  @ApiProperty({ example: 50, description: 'Number of tickets sold on this date' })
  ticketsSold: number;
}

export class TicketTypeSummary {
  @ApiProperty({ example: 'Vé thường', description: 'Name of ticket type' })
  typeName: string;

  @ApiProperty({ example: 250000, description: 'Ticket price' })
  price: number;

  @ApiProperty({ example: 300, description: 'Ticket original price' })
  originalPrice: number;

  @ApiProperty({ example: 120, description: 'Sold amount' })
  sold: number;

  @ApiProperty({ example: 0.8, description: 'Sold ratio' })
  ratio: number;

  @ApiProperty({ example: 150, description: 'Quantity' })
  quantity: number;
}

export class EventSummaryData {
  @ApiProperty({ example: 101, description: 'Event id' })
  eventId: number;

  @ApiProperty({ example: 'Đêm nhạc Acoustic 2025', description: 'Event title' })
  eventTitle: string;

  @ApiProperty({ example: '1041811243642', description: 'Showing time ID' })
  showingId: string;

  @ApiProperty({ example: '2024-12-28T13:00:00.000Z', description: 'Start time of the showing in ISO format' })
  startTime: Date;

  @ApiProperty({ example: '2024-12-28T15:00:00.000Z', description: 'End time of the showing in ISO format' })
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

  @ApiProperty({ type: [RevenueChart], description: 'Revenue chart data' })
  revenueChart: RevenueChart[];
}

export class EventSummaryResponse extends BaseResponse {
  @ApiProperty({ type: EventSummaryData, description: 'Summary data of an event' })
  data: EventSummaryData;
}

export class EventSummaryAIResponse extends BaseResponse {
  @ApiProperty({ description: 'Summary data by AI of an event' })
  data: string;
}