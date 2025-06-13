import { Inject, Injectable } from "@nestjs/common";
import { ShowingRepository } from "src/services/event-svc/repository/showing/showing.repo";
import { CalculateShowingStatusService } from "../../../event/commands/calculateShowingStatus/calculateShowingStatus.service";
import { SlackService } from "src/infrastructure/adapters/slack/slack.service";
import { TicketTypeRepository, TicketTypeStatus } from "src/services/event-svc/repository/ticketType/ticketType.repo";

@Injectable()
export class CalculateTicketTypeStatusService {
  constructor(
    @Inject('ShowingRepository') private readonly showingRepository: ShowingRepository,
    @Inject('TicketTypeRepository') private readonly ticketTypeRepository: TicketTypeRepository,
    private readonly reCalculateAllTicketTypesOfShowingStatus: CalculateShowingStatusService,
    private readonly slackService: SlackService,
  ) {}
  
  async execute(): Promise<void> {
    // Get all showings
    const showings = await this.showingRepository.findAll({}, {
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

        await this.reCalculateAllTicketTypesOfShowingStatus.reCalculateAllTicketTypesOfShowingStatus(showing);
        // Check if the status has changed
        for (const ticketType of showing.TicketType) {
          if (ticketTypeStatusMap.get(ticketType.id) !== ticketType.status) {
            // await this.slackService.sendNotice(`Ticket type status changed for showing ID: ${showing.id}, Ticket Type ID: ${ticketType.id}, New Status: ${ticketType.status}`);
            // Update the ticket type status in the database
            await this.ticketTypeRepository.updateOneById(ticketType.id, {
              status: ticketType.status,
            });
          }
        }
      } catch (error) {
        await this.slackService.sendError(`Error recalculating ticket type status for showing ID: ${showing.id} - ${error.message}`);
      }
    }
  }
}