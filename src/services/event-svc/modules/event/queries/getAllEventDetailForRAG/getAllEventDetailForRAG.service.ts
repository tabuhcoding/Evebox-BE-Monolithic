import { Inject, Injectable } from '@nestjs/common';
import { Events, EventsRepository } from '../../../../repository/events/events.repo';
import { GetAllEventDetailForRAGResponseDto } from './getAllEventDetailForRAG-response.dto';
import { SlackService } from 'src/infrastructure/adapters/slack/slack.service';
import { calculateEventStatusAndMinPriceAndStartDate, calculateShowingStatusAndMinPrice, EventStatus } from 'src/shared/utils/status/status';

@Injectable()
export class GetAllEventDetailForRAGService {
  constructor(
    @Inject('EventsRepository') private readonly eventsRepository: EventsRepository,
    private readonly slackService: SlackService,
  ) {}
  
  async getAllEvents(): Promise<GetAllEventDetailForRAGResponseDto[]> {
    try {
      // Get event that updated in yesterday
      const rawEvents = await this.eventsRepository.findMany({
          deleteAt: null,
          isApproved: true,
          updatedAt: {
            gte: new Date(new Date().setDate(new Date().getDate() - 1)),
          }
        },
        {
          Showing: {
            include: {
              TicketType: {
                where: {
                  deleteAt: null,
                }
              },
            },
            where: {
              endTime: {
                gte: new Date(new Date().setMonth(new Date().getMonth() - 1)),
              },
              deleteAt: null,
            },
          },
          EventCategories: {
            include: {
              Categories: true,
            },
          },
          locations: {
            include: {
              districts: {
                include: {
                  province: true,
                },
              },
            },
          }
        }
      );

      if (!rawEvents.length) return [];

      return Promise.all(rawEvents.map( async (event: Events) => {
        const { street, ward, districts } = event.locations ?? {};
        const districtName = districts?.name || '';
        const provinceName = districts?.province?.name || '';
        const locationsString = `${street || ''}, ${ward || ''}, ${districtName}, ${provinceName}`;

        let minTicketPrice = Infinity;
        let maxTicketPrice = -Infinity;
        let startDate = new Date("9999-12-31T23:59:59Z"); // Set to a far future date
        let endDate = new Date("1970-01-01T00:00:00Z"); // Set to a far past date

        var showingTimes = [];

        for (const showing of event.Showing || []) {  
          const [showingStatus, ] = await calculateShowingStatusAndMinPrice(showing.TicketType || []);
          showingTimes.push({
            start: showing.startTime,
            end: showing.endTime,
            status: showingStatus,
            ticketType: (showing.TicketType || []).map((ticket: any) => ({
              name: ticket.name,
              description: ticket.description,
              price: ticket.originalPrice,
              startTime: ticket.startTime,
              endTime: ticket.endTime,
              status: ticket.status,
            })),
          });

          if (new Date(showing.startTime) < startDate) {
            startDate = new Date(showing.startTime);
          }
          if (new Date(showing.endTime) > endDate) {
            endDate = new Date(showing.endTime);
          }
          
          if (showing.endTime < new Date()) {
            // Skip past showings
            continue;
          }
          for (const ticket of showing.TicketType || []) {
            if (ticket.price < minTicketPrice) minTicketPrice = ticket.price;
            if (ticket.price > maxTicketPrice) maxTicketPrice = ticket.price;
          }
        }

        const [eventStatus, , ] = await calculateEventStatusAndMinPriceAndStartDate(event);

        const eventStatusDescription = eventStatus === EventStatus.AVAILABLE ? "Đang diễn ra"
        : eventStatus === EventStatus.EVENT_OVER ? "Đã kết thúc"
        : eventStatus === EventStatus.NOT_OPEN ? "Chưa diễn ra"
        : eventStatus === EventStatus.REGISTER_CLOSE ? "Đã đóng đăng ký"
        : eventStatus === EventStatus.SALE_CLOSE ? "Đã đóng bán vé"
        : eventStatus === EventStatus.SOLD_OUT ? "Đã bán hết vé"
        : "Không rõ trạng thái";
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
          minAvailablePrice: minTicketPrice === Infinity ? null : minTicketPrice,
          maxAvailablePrice: maxTicketPrice === -Infinity ? null : maxTicketPrice,
          status: eventStatusDescription,
          nearlyAvailableStartTime: startDate < new Date("9999-12-31T23:59:59Z") ? startDate : null,
          farAvailableEndTime: endDate > new Date("1970-01-01T00:00:00Z") ? endDate : null,
          categories: (event.EventCategories || []).map(
            (cat: any) => cat.Categories.name,
          ),
          showingTimes: showingTimes,
        } as GetAllEventDetailForRAGResponseDto;
      }))
    } catch (error) {
      await this.slackService.sendError(
        `Event Service - Event >>> GetAllEventDetailForRAGService - getAllEvents: ${error.message}`
      );

      return [];
    }
  }
}
