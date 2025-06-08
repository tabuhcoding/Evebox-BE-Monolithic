import { ApiProperty } from "@nestjs/swagger";
import { BaseResponse } from "src/shared/constants/baseResponse";

export class TicketTypeRevenueData {
  @ApiProperty()
  ticketTypeId: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  price: number;

  @ApiProperty()
  quantitySold: number;

  @ApiProperty()
  revenue: number;
}

export class ShowingRevenueData {
  @ApiProperty()
  showingId: string;

  @ApiProperty()
  startDate: Date;

  @ApiProperty()
  endDate: Date;

  @ApiProperty()
  revenue: number;

  @ApiProperty({ type: [TicketTypeRevenueData] })
  ticketTypes: TicketTypeRevenueData[];
}

export class EventRevenueData {
  @ApiProperty()
  eventId: number;

  @ApiProperty()
  eventName: string;

  @ApiProperty()
  totalRevenue: number;

  @ApiProperty()
  platformFeePercent: number;

  @ApiProperty()
  actualRevenue: number;

  @ApiProperty({ type: [ShowingRevenueData] })
  showings: ShowingRevenueData[];
}

export class RevenueByIdDto extends BaseResponse {
  @ApiProperty({ type: [EventRevenueData], description: "Revenue of org" })
    data: EventRevenueData[];
}