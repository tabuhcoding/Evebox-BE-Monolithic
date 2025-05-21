import { Inject, Injectable } from '@nestjs/common';
import { Result, Ok, Err } from 'oxide.ts';
import { EventsRepository } from 'src/services/event-svc/repository/events/events.repo';
import { GetEventFrontDisplayService } from '../getEventFrontDisplay/getEventFrontDisplay.service';
import { EventStatus } from 'src/shared/utils/status/status';
import { EventFrontDisplayDto } from '../getEventFrontDisplay/getEventFrontDisplay-response.dto';

@Injectable()
export class GetRecommendEventService {
  constructor(
      private readonly getEventFrontDisplayService: GetEventFrontDisplayService,
    @Inject('EventsRepository') private readonly eventsRepository: EventsRepository,
  ) {}

  async getRecommendedEvents(timeWindow: "week" | "month"): Promise<Result<EventFrontDisplayDto[], Error>> {
    try {
      const now = new Date();

      let endDate: Date;

      if (timeWindow === 'week') {
        const remainingDays = 7 - now.getDay();
        endDate = new Date(now);
        endDate.setDate(now.getDate() + remainingDays);
        endDate.setHours(23, 59, 59, 999);
      } else if (timeWindow === 'month') {
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        endDate.setHours(23, 59, 59, 999);
      } else {
        throw new Error('Invalid timeWindow value. Use "week" or "month".');
      }

      const recommendedEvents = await this.eventsRepository.findMany(
        {
          Showing: {
            some: {
              startTime: {
                gte: now,
                lte: endDate,
              }
            }
          },
          deleteAt: null,
        },
        {
          Showing: {
            select: {
              id: true,
              startTime: true,
              TicketType: {
                select: {
                  id: true,
                  price: true,
                },
              },
            },
            where: {
              startTime: {
                gte: new Date(),
              },
            },
          }
        },
        { lastScore: 'desc' },
        0,
        20,
      )

      // Map the events to the response DTO
      const eventDtos = await Promise.all(recommendedEvents.map(async (event) => {
        const result = await this.getEventFrontDisplayService.caculateEventStatusAndMinPriceAndStartDate(event);
        if (result.isErr()) {
          return null;
        }
        return result.unwrap();
      }));

      // Filter out any null results
      const filteredEventDtos = eventDtos.filter((event) => event !== null
      && event.status !== EventStatus.EVENT_OVER 
      && event.status !== EventStatus.SOLD_OUT
      && event.status !== EventStatus.REGISTER_CLOSE
      && event.status !== EventStatus.SALE_CLOSE
      ) as EventFrontDisplayDto[];
      // Return the result
      return Ok(filteredEventDtos);
    } catch (error) {
      console.error(error);
      return Err(new Error('Failed to fetch recommended events.'));
    }
  }
}
