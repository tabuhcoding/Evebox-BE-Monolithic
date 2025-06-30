import { Inject, Injectable } from "@nestjs/common";
import { ShowingRepository } from "src/services/event-svc/repository/showing/showing.repo";
import { CalculateShowingStatusService } from "../../../event/commands/calculateShowingStatus/calculateShowingStatus.service";
import { SlackService } from "src/infrastructure/adapters/slack/slack.service";
import { TicketTypeRepository, TicketTypeStatus } from "src/services/event-svc/repository/ticketType/ticketType.repo";
import { EventsRepository } from "src/services/event-svc/repository/events/events.repo";

@Injectable()
export class CalculateTicketTypeStatusService {
  constructor(
    @Inject('ShowingRepository') private readonly showingRepository: ShowingRepository,
    @Inject('TicketTypeRepository') private readonly ticketTypeRepository: TicketTypeRepository,
    @Inject('EventsRepository') private readonly eventsRepository: EventsRepository,
    private readonly reCalculateAllTicketTypesOfShowingStatus: CalculateShowingStatusService,
    private readonly slackService: SlackService,
  ) {}
  
  async execute(): Promise<void> {
    // Get all showings
    const showings = await this.showingRepository.findAll({
      deleteAt: null,
      endTime:{
        // Endtime should be greater than or equal to the month ago since now
        gte: new Date(new Date().setMonth(new Date().getMonth() - 1)),
      }
    }, {
      TicketType: true,
    });

    // Loop through each showing and recalculate ticket type status
    for (const showing of showings) {
      try {
        if (!showing.TicketType || showing.TicketType.length === 0) {

          continue;
        }

        // create a ticketType status map
        const ticketTypeStatusMap = new Map<string, TicketTypeStatus>();
        for (const ticketType of showing.TicketType) {
          ticketTypeStatusMap.set(ticketType.id, ticketType.status);
        }

        var price = showing.minTicketPrice > 0 ? showing.minTicketPrice : Number.MAX_VALUE;

        await this.reCalculateAllTicketTypesOfShowingStatus.reCalculateAllTicketTypesOfShowingStatus(showing);
        // Check if the status has changed
        for (const ticketType of showing.TicketType) {
          price = ticketType.price < price ? ticketType.price : price;
          if (ticketTypeStatusMap.get(ticketType.id) !== ticketType.status) {
            // await this.slackService.sendNotice(`Ticket type status changed for showing ID: ${showing.id}, Ticket Type ID: ${ticketType.id}, New Status: ${ticketType.status}`);
            // Update the ticket type status in the database
            await this.ticketTypeRepository.updateOneById(ticketType.id, {
              status: ticketType.status,
              updatedAt: new Date(),
            });
          }
        }

        if (showing.minTicketPrice !== price) {
          // Update the minimum ticket price for the showing
          await this.showingRepository.updateOneById(showing.id, {
            minTicketPrice: price === Number.MAX_VALUE ? 0 : price,
            updatedAt: new Date(),
          });

          const event = await this.eventsRepository.findOneById(showing.eventId)

          await this.eventsRepository.updateOneById(showing.eventId, {
            minTicketPrice: Math.min(price, event.minTicketPrice || 0),
          });
        }
      } catch (error) {
        await this.slackService.sendError(`Error recalculating ticket type status for showing ID: ${showing.id} - ${error.message}`);
      }
    }
  }

  async updateEvents(): Promise<void> {
    const events = await this.eventsRepository.findAll({
      Showing: {
          some: {
            startTime: {
              gte: new Date(new Date().setMonth(new Date().getMonth() - 1)),
            },
            deleteAt: null,
          },
        }
    },
      {
        Showing: {
          include: {
            TicketType: true,
          }
        },
      }
    );

    for (const event of events) {
      try {
        if (!event.Showing || event.Showing.length === 0) {
          continue;
        }
          var nearlyStartTime = new Date("9999-12-31T23:59:59.999Z");
          var furtherestEndTime = new Date("0001-01-01T00:00:00.000Z");
          const monthAgo = new Date(new Date().setMonth(new Date().getMonth() - 1));
          var eventprice = Number.MAX_VALUE;
        // Loop through each showing and recalculate ticket type status
        for (const showing of event.Showing) {
          try {
            if (!showing.TicketType || showing.TicketType.length === 0) {

              continue;
            }
            var price = showing.minTicketPrice || Number.MAX_VALUE;
            // Check if the status has changed
            for (const ticketType of showing.TicketType) {
              price = ticketType.price < price ? ticketType.price : price;
            }
          } catch (error) {
            await this.slackService.sendError(`Error recalculating ticket type status for showing ID: ${showing.id} - ${error.message}`);
          }
          if (new Date(showing.endTime) > monthAgo){
            if (new Date(showing.startTime) < nearlyStartTime) {
              nearlyStartTime = new Date(showing.startTime);
            }
            if (new Date(showing.endTime) > furtherestEndTime) {
              furtherestEndTime = new Date(showing.endTime);
            }
            eventprice = eventprice < price ? eventprice : price;
          }
        }

        await this.eventsRepository.updateOneById(event.id, {
          minTicketPrice: eventprice === Number.MAX_VALUE ? 0 : eventprice,
          nearlyStartDate: nearlyStartTime,
          nearlyEndDate: furtherestEndTime,
          updatedAt: new Date(),
        });
        
      } catch (error) {
        await this.slackService.sendError(`Error recalculating ticket type status for event ID: ${event.id} - ${error.message}`);
      }
    }
  }
}