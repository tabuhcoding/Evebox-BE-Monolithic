import { Inject, Injectable } from '@nestjs/common';
import { Events, EventsRepository } from '../../../../repository/events/events.repo';
import { GetAllEventDetailForRAGResponseDto } from './getAllEventDetailForRAG-response.dto';

@Injectable()
export class GetAllEventDetailForRAGService {
  constructor(
    @Inject('EventsRepository') private readonly eventsRepository: EventsRepository,
  ) {}
  
  async getAllEvents(): Promise<GetAllEventDetailForRAGResponseDto[]> {
    try {
      const rawEvents = await this.eventsRepository.findMany({
        deleteAt: null,
        isApproved: true,
      });

      if (!rawEvents.length) return [];

      return rawEvents.map((event: Events) => {
        const { street, ward, districts } = event.locations ?? {};
        const districtName = districts?.name || '';
        const provinceName = districts?.province?.name || '';
        const locationsString = `${street || ''}, ${ward || ''}, ${districtName}, ${provinceName}`;

        let minTicketPrice = Infinity;
        let maxTicketPrice = -Infinity;

        for (const showing of event.Showing || []) {
          for (const ticket of showing.TicketType || []) {
            if (ticket.price < minTicketPrice) minTicketPrice = ticket.price;
            if (ticket.price > maxTicketPrice) maxTicketPrice = ticket.price;
          }
        }

        return {
          id: event.id,
          name: event.title,
          description: event.description,
          location: locationsString,
          venue: event.venue,
          organizer: event.orgName,
          organizerDescription: event.orgDescription,
          isOnlineEvent: event.isOnline,
          isOnlyOnEvebox: event.isOnlyOnEve,
          isSpecialEvent:
            event.isSpecial || (event.EventCategories || []).some((cat: any) => cat.isSpecial),
          totalViews: event.totalClicks,
          viewsPerWeek: event.weekClicks,
          minPrice: minTicketPrice === Infinity ? 0 : minTicketPrice,
          maxPrice: maxTicketPrice === -Infinity ? 0 : maxTicketPrice,
          categories: (event.EventCategories || []).map(
            (cat: any) => cat.Categories.name,
          ),
          showingTimes: (event.Showing || []).map((showing: any) => ({
            start: showing.startTime,
            end: showing.endTime,
            ticketType: (showing.TicketType || []).map((ticket: any) => ({
              name: ticket.name,
              description: ticket.description,
              price: ticket.originalPrice,
              startTime: ticket.startTime,
              endTime: ticket.endTime,
            })),
          })),
        } as GetAllEventDetailForRAGResponseDto;
      });
    } catch (error) {
      console.error('Error fetching events in service:', error);
      return [];
    }
  }
}
