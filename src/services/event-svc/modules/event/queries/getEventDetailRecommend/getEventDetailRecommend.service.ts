import { Inject, Injectable } from "@nestjs/common";
import { Result, Ok, Err } from "oxide.ts";
import { EventsRepository } from "src/services/event-svc/repository/events/events.repo";
import { GetEventFrontDisplayService } from "../getEventFrontDisplay/getEventFrontDisplay.service";
import { EventFrontDisplayDto } from "../getEventFrontDisplay/getEventFrontDisplay-response.dto";
import { SlackService } from "src/infrastructure/adapters/slack/slack.service";

@Injectable()
export class GetEventDetailRecommendService {
  constructor(
    @Inject('EventsRepository') private readonly eventsRepository: EventsRepository,
    private readonly getEventFrontDisplayService: GetEventFrontDisplayService,
    private readonly slackService: SlackService,
  ) {}

  async getRecommendedEventsInDetail(eventId: number, limit: string): Promise<Result<EventFrontDisplayDto[], Error>> {
    if (!eventId) {
      return Err(new Error("Event ID is required."));
    }
    try {
      if (!limit) {
        limit = "20";
      }
      
      const event = await this.eventsRepository.findOneById(eventId,
        {
          locations: {
            include: {
              districts: true,
            },
          },
        }
      )

      if (!event) {
        return Err(new Error("Event not found."));
      }

      const now = new Date();

      const recommendedEvents = await this.eventsRepository.findMany(
        {
          locations: {
          districts: {
            provinceId: event.locations.districts.provinceId,
          },
          },
          Showing: {
            some: {
              startTime: limit === 'all' ? undefined : { gte: now },
            },
          },
          id: { not: eventId }, 
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
        limit === 'all' ? undefined : parseInt(limit, 10),
      )

      if (!recommendedEvents || recommendedEvents.length === 0) {
        return Err(new Error("No recommended events found."));
      }

      // Map to EventFrontDisplayDto
      const recommendedEventsDto = await Promise.all(
        recommendedEvents.map(async (event) => {
          const result = await this.getEventFrontDisplayService.caculateEventStatusAndMinPriceAndStartDate(event);
          if (result.isErr()) {
            return null;
          }
          return result.unwrap();
        }
      ));

      // Filter out any null results
      const filteredEventDtos = recommendedEventsDto.filter((event) => event !== null
        && event.status !== 'EVENT_OVER' 
        && event.status !== 'SOLD_OUT'
        && event.status !== 'REGISTER_CLOSE'
        && event.status !== 'SALE_CLOSE'
      ) as EventFrontDisplayDto[];

      return Ok(filteredEventDtos);
    } catch (error) {
      this.slackService.sendError(`Event Service - Event >>> getRecommendedEventsInDetail: ${error.message}`);

      return Err(new Error("Event not found."));
    }
  }

}