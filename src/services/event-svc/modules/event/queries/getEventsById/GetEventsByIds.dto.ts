export class GetEventDetailDto {
  id: number;
  name: string;
  description?: string;

  location: string;
  venue?: any;

  organizer: string;
  organizerDescription?: string;

  isOnlineEvent: boolean;
  isOnlyOnEvebox: boolean;
  isSpecialEvent: boolean;

  totalViews: number;
  viewsPerWeek: number;

  minPrice: number;
  maxPrice: number;

  categories: string[];

  showingTimes: {
    start: Date;
    end: Date;
    ticketType: {
      name: string;
      description?: string;
      price: number;
      startTime: Date;
      endTime: Date;
    }[];
  }[];
}
