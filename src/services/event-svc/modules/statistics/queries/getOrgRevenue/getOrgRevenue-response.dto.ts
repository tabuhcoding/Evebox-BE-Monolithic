import { ApiProperty } from "@nestjs/swagger";
import { BaseResponse } from "src/shared/constants/baseResponse";
import { Pagination } from "src/shared/constants/pagination";

export class TicketTypeRevenueData {
  @ApiProperty({ example: "abc-123", description: "Ticket type ID" })
  ticketTypeId: string;

  @ApiProperty({ example: "VIP", description: "Ticket type name" })
  name: string;

  @ApiProperty({ example: 500000, description: "Ticket price" })
  price: number;

  @ApiProperty({ example: 100, description: "Tickets sold" })
  sold: number;

  @ApiProperty({ example: 50000000, description: "Revenue of ticket type" })
  revenue: number;
}

export class ShowingRevenueData {
  @ApiProperty({ example: "123e4567-e89b-12d3-a456-426614174000", description: "Showing id" })
  showingId: string;

  @ApiProperty({ example: "2025-01-25T00:00:00.000Z", description: "Start time of showing" })
  startDate: Date;

  @ApiProperty({ example: "2025-01-25T02:00:00.000Z", description: "End time of showing" })
  endDate: Date;

  @ApiProperty({ example: 100000000, description: "Showing revenue" })
  revenue: number;

  @ApiProperty({ type: [TicketTypeRevenueData], description: "Ticket type revenue details" })
  ticketTypes: TicketTypeRevenueData[];
}

export class EventRevenueData {
  @ApiProperty({ example: 101, description: "Event id" })
  eventId: number;

  @ApiProperty({ example: "Live Concert 2025", description: "Event name" })
  eventName: string;

  @ApiProperty({ example: 200000000, description: "Event revenue" })
  totalRevenue: number;

  @ApiProperty({ example: 10, description: "Platform fee (%)" })
  platformFeePercent: number;

  @ApiProperty({ example: 180000000, description: "Actual Revenue" })
  actualRevenue: number;

  @ApiProperty({ type: [ShowingRevenueData], description: "List of showing" })
  showings: ShowingRevenueData[];
}

export class OrganizerRevenueData {
  @ApiProperty({ example: "dattruong01082@gmail.com", description: "Organizer id" })
  orgId: string;

  @ApiProperty({ example: "Anh Trai Say Hi", description: "Organizer name" })
  organizerName: string;

  @ApiProperty({ example: 1000000000, description: "Total revenue from all events" })
  totalRevenue: number;

  @ApiProperty({ example: 10, description: "Platform fee (%)" })
  platformFeePercent: number;

  @ApiProperty({ example: 900000000, description: "Actual revenue" })
  actualRevenue: number;

  @ApiProperty({ type: [EventRevenueData], description: "List events of organizer" })
  events: EventRevenueData[];
}

// Ticket Type Raw
export class TicketTypeRaw {
  @ApiProperty({ example: 'vip-001', description: 'Ticket type ID' })
  id: string;

  @ApiProperty({ example: 'VIP', description: 'Ticket type name' })
  name: string;

  @ApiProperty({ example: 500000, description: 'Ticket price' })
  price: number;
}

// Showing Raw
export class ShowingRaw {
  @ApiProperty({ example: 'showing-uuid-001', description: 'Showing ID' })
  id: string;

  @ApiProperty({ example: '2025-01-25T00:00:00.000Z', description: 'Start time of showing' })
  startTime: Date;

  @ApiProperty({ example: '2025-01-25T02:00:00.000Z', description: 'End time of showing' })
  endTime: Date;

  @ApiProperty({ type: [TicketTypeRaw], description: 'List of ticket types for this showing' })
  TicketType: TicketTypeRaw[];
}

export class EventWithShowings {
  @ApiProperty({ example: 101, description: 'Event id' })
  id: number;

  @ApiProperty({ example: 'Live Concert 2025', description: 'Event title' })
  title: string;

  @ApiProperty({ example: 'Annual event description', description: 'Event description' })
  description: string;

  @ApiProperty({ example: 'org-123', description: 'Organizer ID' })
  organizerId: string;

  @ApiProperty({ example: 'Anh Trai Say Hi', description: 'Organizer name' })
  orgName: string;

  @ApiProperty({ example: true, description: 'Is event approved?' })
  isApproved: boolean;

  @ApiProperty({ example: null, description: 'DeleteAt (null if not deleted)' })
  deleteAt: Date | null;

  @ApiProperty({ type: [ShowingRaw], description: 'List of showings for this event' })
  Showing: ShowingRaw[];
}

export class OrganizerRevenueResponseDto extends BaseResponse {
  @ApiProperty({ type: [OrganizerRevenueData], description: "Danh sách doanh thu theo nhà tổ chức" })
  data: OrganizerRevenueData[];

  @ApiProperty({ type: Pagination, description: 'Pagination information' })
  pagination?: Pagination;
}

export class AppRevenueData {
  @ApiProperty({ example: 1000000000, description: "Total revenue from all events" })
  totalRevenue: number;

  @ApiProperty({ example: 10, description: "Platform fee (%)" })
  platformFeePercent: number;

  @ApiProperty({ example: 900000000, description: "Actual revenue" })
  actualRevenue: number;

  @ApiProperty({ type: [OrganizerRevenueData], description: "List of organizer revenue data" })
  organizers: OrganizerRevenueData[];
}

export class GetAppRevenueResponseDto extends BaseResponse {
  @ApiProperty({ type: [OrganizerRevenueData], description: "List of organizer revenue data" })
  data: AppRevenueData;

  @ApiProperty({ type: Pagination, description: 'Pagination information' })
  pagination?: Pagination;
}