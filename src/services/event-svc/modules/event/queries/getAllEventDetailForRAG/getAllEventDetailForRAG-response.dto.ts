import { TicketTypeStatus } from "src/services/event-svc/repository/ticketType/ticketType.repo";
import { EventStatus, ShowingStatus } from "src/shared/utils/status/status";

export class GetAllEventDetailForRAGResponseDto {
  id: number;
  name: string;
  description: string;
  location: string;
  venue: string;
  organizer: string;
  organizerDescription: string;
  isOnlineEvent: boolean;
  isOnlyOnEvebox: boolean;
  isSpecialEvent: boolean;
  totalViews: number;
  viewsPerWeek: number;
  minAvailablePrice: number | null;
  maxAvailablePrice: number | null;
  nearlyAvailableStartTime?: Date | null;
  farAvailableEndTime?: Date | null;
  status: string;
  categories: string[];
  showingTimes: {
    start: Date;
    end: Date;
    status: string;
    ticketType: {
      name: string;
      description: string;
      price: number;
      startSaleTime: Date;
      endSaleTime: Date;
      status: string;
    }[]
  }[];
}