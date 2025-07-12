export class TicketTypeRevenueData {
  name?: string;
  price: number;
  sold: number;
  total_revenue: number;
}

export class ShowingRevenueData {
  showing_id: string;
  start_date: Date;
  end_date: Date;
  total_revenue: number;
  ticket_types: TicketTypeRevenueData[];
}

export class EventRevenueData {
  event_id: number;
  event_name: string;
  total_revenue: number;
  showings: ShowingRevenueData[];
}

export class OrganizerRevenueData {
  org_id: string;
  org_name: string;
  total_revenue: number;
  events: EventRevenueData[];
}

export class RevenueData {
  date: Date;
  total_revenue: number;

  organizers: OrganizerRevenueData[];
}