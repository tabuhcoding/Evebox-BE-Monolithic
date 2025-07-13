export class TicketTypeRevenueDataDTO {
  name?: string;
  price: number;
  sold: number;
  total_revenue: number;
}

export class ShowingRevenueDataDTO {
  showing_id: string;
  start_date: Date;
  end_date: Date;
  total_revenue: number;
  ticket_types: Map<string,TicketTypeRevenueDataDTO>;
}

export class EventRevenueDataDTO {
  event_id: number;
  event_name: string;
  total_revenue: number;
  showings: Map<string,ShowingRevenueDataDTO>;
}

export class OrganizerRevenueDataDTO {
  org_id: string;
  org_name: string;
  total_revenue: number;
  events: Map<number,EventRevenueDataDTO>;
}

export class RevenueDataDTO {
  date: Date;
  total_revenue: number;

  organizers: Map<string, OrganizerRevenueDataDTO>;
}