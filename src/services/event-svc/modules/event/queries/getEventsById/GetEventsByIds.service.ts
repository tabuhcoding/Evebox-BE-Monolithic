import { Inject, Injectable } from '@nestjs/common';
import { EventsRepository, Events } from '../../../../repository/events/events.repo';
import { GetEventDetailDto } from '../../queries/getEventsById/GetEventsByIds.dto';

@Injectable()
export class GetEventsByIdsService {
  constructor(
    @Inject('EventsRepository') private readonly eventsRepository: EventsRepository,
  ) {}

  async getEventsByIds(eventIds: number[]): Promise<GetEventDetailDto[]> {
    if (!eventIds.length) return [];

    const rawEvents = await this.eventsRepository.findManyByIdsWithDetails(eventIds);

    return rawEvents.map((event: Events) => {
      const { street, ward, districts } = event.locations ?? {};
      const districtName = districts?.name || '';
      const provinceName = districts?.province?.name || '';
      const location = `${street || ''}, ${ward || ''}, ${districtName}, ${provinceName}`;

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
        location,
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
        categories: (event.EventCategories || []).map(cat => cat.Categories.name),
        showingTimes: (event.Showing || []).map(showing => ({
          start: showing.startTime,
          end: showing.endTime,
          ticketType: (showing.TicketType || []).map(ticket => ({
            name: ticket.name,
            description: ticket.description,
            price: ticket.originalPrice,
            startTime: ticket.startTime,
            endTime: ticket.endTime,
          })),
        })),
      } as GetEventDetailDto;
    });
  }
}
