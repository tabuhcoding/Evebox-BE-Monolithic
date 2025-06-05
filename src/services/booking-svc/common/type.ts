
export interface SelectTicketTypeData {
  ticketTypeId: string;
  sectionId?: number;
  quantity?: number;
  seatId?: number[];
} 

export interface AggregatedSelectTicketTypeItem {
  id: string; // user email
  timestamp: number;
  timeout: number;
  data: SelectTicketTypeData[];
}