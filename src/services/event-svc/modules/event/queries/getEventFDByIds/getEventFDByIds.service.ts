import { Inject, Injectable } from "@nestjs/common";
import { Result, Ok, Err } from 'oxide.ts';
import { GetEventFDByIdsResponseDto } from "./getEventFDByIds-response.dto";
import { EventsRepository } from "src/services/event-svc/repository/events/events.repo";
import { GetEventFrontDisplayService } from "../getEventFrontDisplay/getEventFrontDisplay.service";
import { EventFrontDisplayDto } from "../getEventFrontDisplay/getEventFrontDisplay-response.dto";
import { EventStatus } from "src/shared/utils/status/status";

@Injectable()
export class GetEventFDByIdsService {
  constructor(
    @Inject('EventsRepository') private readonly eventsRepository: EventsRepository,
    private readonly getEventFrontDisplayService: GetEventFrontDisplayService,
   ) {}

  async execute(ids: number[]): Promise<Result<GetEventFDByIdsResponseDto, Error>> {
    try {
      // Fetch events by IDs
      const events = await this.eventsRepository.findByIds(ids,
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
        }
      );

      // Map the events to the response DTO
      const eventDtos = await Promise.all(events.map(async (event) => {
        const result = await this.getEventFrontDisplayService.caculateEventStatusAndMinPriceAndStartDate(event);
        if (result.isErr()) {
          return null;
        }
        return result.unwrap();
      }
      ));

      // Filter out any null results
      const filteredEventDtos = eventDtos.filter((event) => event !== null
      && event.status !== EventStatus.EVENT_OVER 
      && event.status !== EventStatus.SOLD_OUT
      && event.status !== EventStatus.REGISTER_CLOSE
      && event.status !== EventStatus.SALE_CLOSE
      ) as EventFrontDisplayDto[];
      // Return the result
      return Ok({ event: filteredEventDtos });

    } catch (error) {
      console.error(error);
      return Err(new Error("Failed to fetch events by IDs."));
    }
  }
}