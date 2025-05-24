import { Inject, Injectable } from "@nestjs/common";
import { Result, Ok, Err } from "oxide.ts";
import { EventsRepository } from "src/services/event-svc/repository/events/events.repo";
import { EventDetailResponseDto, ShowingDto } from "./getEventDetail-response.dto";
import { SlackService } from "src/infrastructure/adapters/slack/slack.service";
import { SeatmapRepository } from "src/services/event-svc/repository/seatmap/seatmap.repo";
import { calculateShowingStatusAndMinPrice, EventStatus, ShowingStatus } from "src/shared/utils/status/status";
import { CalculateShowingStatusService } from "../../commands/calculateShowingStatus/calculateShowingStatus.service";
import { UserClickHistoryRepository } from "src/services/event-svc/repository/userClickHistory/userClickHistory.repo";
import { CheckUserExistService } from "src/services/auth-svc/modules/user/commands/checkuserExist/checkuserExist.service";

@Injectable()
export class GetEventDetailService {
  constructor(
    @Inject('EventsRepository') private readonly eventsRepository: EventsRepository,
    @Inject('SeatmapRepository') private readonly seatmapRepository: SeatmapRepository,
    @Inject('UserClickHistoryRepository') private readonly userClickHistoryRepository: UserClickHistoryRepository,
    private readonly slackService: SlackService,
    private readonly calculateShowingStatusService: CalculateShowingStatusService,
    private readonly checkUserExistService: CheckUserExistService,
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

  async increasePostClickCount(eventId: number, userId?: string){
    if (!eventId) {
      return;
    }

    try{
      // If userId is provided, update user click history
      if (userId) {
        // Check if user exists
        const userExists = await this.checkUserExistService.execute(userId);
        if (!userExists) {
          // this.slackService.sendError(`Event Svc - Event >>> GetEventDetail Increase Post Click Count: User with ID ${userId} does not exist.`);
          
          return;
        }

        // Check if create new click history in last 30 minutes
        const userClickHistory = await this.userClickHistoryRepository.findOne({
          userId: userId,
          eventId: eventId,
          date: {
            gte: new Date(Date.now() - 30 * 60 * 1000), // last 30 minutes
          },
        });

        if (userClickHistory) {
          // If user has clicked this event in last 30 minutes, do not create new click history
          return;
        }

        // Increase post click count
        this.eventsRepository.updateOneById(eventId, {
          weekClicks: { increment: 1 },
          totalClicks: { increment: 1 },
        });

        this.userClickHistoryRepository.insertOne({
          userId: userId,
          eventId: eventId,
          date: new Date(),
        })
      }

    } catch (error) {
      this.slackService.sendError(` Event Svc - Event >>> GetEventDetail Increase Post Click Count: ${error}`);
    }
  }
}