import { Inject, Injectable } from "@nestjs/common";
import { Result, Ok, Err } from "oxide.ts";
import { EventsRepository } from "src/services/event-svc/repository/events/events.repo";
import { EventDetailResponseDto, ShowingDto } from "./getEventDetail-response.dto";
import { SlackService } from "src/infrastructure/adapters/slack/slack.service";
import { Showing } from "src/services/event-svc/repository/showing/showing.repo";
import { getSeatmapType, SeatmapType } from "src/shared/utils/status/seatmap";
import { SeatmapRepository } from "src/services/event-svc/repository/seatmap/seatmap.repo";
import { TicketType } from "src/services/event-svc/repository/ticketType/ticketType.repo";
import { calculateShowingStatusAndMinPrice, EventStatus, ShowingStatus } from "src/shared/utils/status/status";
import { CalculateShowingStatusService } from "../../commands/calculateShowingStatus/calculateShowingStatus.service";

@Injectable()
export class GetEventDetailService {
  constructor(
    @Inject('EventsRepository') private readonly eventsRepository: EventsRepository,
    @Inject('SeatmapRepository') private readonly seatmapRepository: SeatmapRepository,
    private readonly slackService: SlackService,
    private readonly calculateShowingStatusService: CalculateShowingStatusService,
  ) {}

  async execute(eventId: number): Promise<Result<EventDetailResponseDto, Error>> {
    if (!eventId) {
      return Err(new Error("Event ID is required."));
    }
    try {
      // find event by ID
      const event = await this.eventsRepository.findOneById(eventId,
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
              startTime: {
                gte: new Date(),
              },
              deleteAt: null,
            },
          },
          EventCategories: {
            include: {
              Categories: true,
            },
          },
        }
      );

      if (!event) {
        return Err(new Error("Event not found."));
      }

      let eventsDto : EventDetailResponseDto = {
        id: event.id,
        title: event.title,
        description: event.description,
        organizerId: event.organizerId,
        venue: event.venue,
        imgLogoUrl: event.imgLogoUrl,
        imgPosterUrl: event.imgPosterUrl,
        isOnline: event.isOnline,
        lastScore: event.lastScore,
        isSpecial: event.isSpecial,
        isOnlyOnEve: event.isOnlyOnEve,
        orgName: event.orgName,
        orgDescription: event.orgDescription,
        categories: event.EventCategories.map(category => {
          return {
            id: category.Categories?.id || 0,
            name: category.Categories?.name || '',
          };
        }),
        status: EventStatus.EVENT_OVER,
        startDate: new Date("9999-12-31T23:59:59.999Z"),
        showing: [],
        locationsString: "",
        minPrice: Number.MAX_VALUE,
      }

      // Location string
      const { street, ward, districts } = event.locations ?? {};
      const districtName = districts?.name || '';
      const provinceName = districts?.province?.name || '';
      eventsDto.locationsString = `${street || ''}, ${ward || ''}, ${districtName}, ${provinceName}`;

      // Calculate event status and minimum price
      let showingStatusSet = new Set<ShowingStatus>();
      let nowDate = new Date();
      if ( !event.Showing || event.Showing.length === 0) {
        eventsDto.status = EventStatus.EVENT_OVER;
        eventsDto.minPrice = 0;
        eventsDto.startDate = new Date("9999-12-31T23:59:59.999Z");
      }
      else{
        for (const showing of event.Showing) {
          await this.calculateShowingStatusService.reCalculateAllTicketTypesOfShowingStatus(showing);
          const [showingStatus, showingMinPrice] = await calculateShowingStatusAndMinPrice(showing.TicketType);
          showingStatusSet.add(showingStatus);

          // Update min price
          if (showingMinPrice < eventsDto.minPrice) {
            eventsDto.minPrice = showingMinPrice;
          }
          // Update start date
          if (new Date(showing.startTime) < eventsDto.startDate && new Date(showing.startTime) > nowDate) {
            eventsDto.startDate = new Date(showing.startTime);
          }

          // Add showing to DTO
          const showingDto: ShowingDto = {
            ...showing,
            status: showingStatus,
            TicketType: showing.TicketType.map(ticketType => ({
              ...ticketType,
              sections: [],
            })),
          };
          eventsDto.showing.push(showingDto);
        }

        // Determine event status based on showing statuses
        if (showingStatusSet.has(ShowingStatus.BOOK_NOW) || showingStatusSet.has(ShowingStatus.REGISTER_NOW)) {
          eventsDto.status = EventStatus.AVAILABLE;
        }
        else if (showingStatusSet.has(ShowingStatus.NOT_OPEN)) {
          eventsDto.status = EventStatus.NOT_OPEN;
        }
        else if (showingStatusSet.has(ShowingStatus.SALE_CLOSE)) {
          eventsDto.status = EventStatus.SALE_CLOSE;
        }
        else if (showingStatusSet.has(ShowingStatus.REGISTER_CLOSE)) {
          eventsDto.status = EventStatus.REGISTER_CLOSE;
        }
        else if (showingStatusSet.has(ShowingStatus.SOLD_OUT)) {
          eventsDto.status = EventStatus.SOLD_OUT;
        }
        else {
          eventsDto.status = EventStatus.EVENT_OVER;
        }
      }

      return Ok(eventsDto);
    } catch (error) {
      this.slackService.sendError(` Event Svc - Event >>> GetEventDetail: ${error}`);
      
      return Err(new Error("Failed to fetch event detail data."));
    }
    
  }
}