import { Inject, Injectable } from "@nestjs/common";
import { Result, Ok, Err } from "oxide.ts";
import { EventsRepository } from "src/services/event-svc/repository/events/events.repo";
import { GetEventFrontDisplayService } from "../getEventFrontDisplay/getEventFrontDisplay.service";
import { EventFrontDisplayDto } from "../getEventFrontDisplay/getEventFrontDisplay-response.dto";
import { SlackService } from "src/infrastructure/adapters/slack/slack.service";
import { CheckFavoriteService } from "src/services/auth-svc/modules/user/commands/check-favorite/checkFavorite.service";
import { OpenAIVectorStoreService } from "src/services/rag-svc/modules/openai/core-embedding/vector-store.service";

@Injectable()
export class GetEventDetailRecommendService {
  constructor(
    @Inject('EventsRepository') private readonly eventsRepository: EventsRepository,
    private readonly getEventFrontDisplayService: GetEventFrontDisplayService,
    private readonly slackService: SlackService,
    private readonly checkFavoriteService: CheckFavoriteService,
    private readonly openAIVectorStoreService: OpenAIVectorStoreService,
  ) {}

  async getRecommendedEventsInDetail(eventId: number, limit: string, userId?: string): Promise<Result<EventFrontDisplayDto[], Error>> {
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

      const eventSimilarities = await this.openAIVectorStoreService.findSimilarEventsFromEvent(eventId.toString(), 40);
      if (!eventSimilarities || eventSimilarities.length === 0) {
        return Ok([]);
      }

      console.log(`Found ${eventSimilarities.length} similar events for event ID ${eventId}`);

      const eventIds = eventSimilarities.map(similarity => similarity[0].metadata.eventId >> 0);

      const recommendedEvents = await this.eventsRepository.findMany(
        {
          id: {
            in: eventIds,}
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
                  status: true,
                },
              },
            },
            where: {
              startTime: {
                gte: new Date(now.getFullYear(), now.getMonth() - 3, now.getDate()),
              },
            },
          }
        },
        { nearlyEndDate: 'desc' }, 
      )

      if (!recommendedEvents || recommendedEvents.length === 0) {
        return Err(new Error("No recommended events found."));
      }

      // Map to EventFrontDisplayDto
      var recommendedEventsDto: (EventFrontDisplayDto)[] = [];

      for (const event of recommendedEvents) {
        const result = await this.getEventFrontDisplayService.caculateEventStatusAndMinPriceAndStartDate(event, 3);
        if (result.isErr()) {
          continue; // Skip this event if there's an error
        }
        recommendedEventsDto.push(result.unwrap());
      }

      // Filter out any null results
      const filteredEventDtos = recommendedEventsDto.filter((event) => event !== null
        && event.id !== eventId
        // && event.status !== 'EVENT_OVER' 
        // && event.status !== 'SOLD_OUT'
        // && event.status !== 'REGISTER_CLOSE'
        // && event.status !== 'SALE_CLOSE'
      ) as EventFrontDisplayDto[];

      if (userId) {
        await this.checkFavoriteService.attachFavorite(userId, filteredEventDtos);
      }

      return Ok(filteredEventDtos);
    } catch (error) {
      await this.slackService.sendError(`Event Service - Event >>> getRecommendedEventsInDetail: ${error.message}`);

      return Err(new Error("Event not found."));
    }
  }

}