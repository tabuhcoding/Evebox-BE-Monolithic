import { Inject, Injectable } from "@nestjs/common";
import { Result, Ok, Err } from "oxide.ts";

import { TicketTypeRepository } from "src/services/event-svc/repository/ticketType/ticketType.repo";
import { ShowingRepository } from "src/services/event-svc/repository/showing/showing.repo";
import { CheckUserExistService } from "src/services/auth-svc/modules/user/commands/checkuserExist/checkuserExist.service";
import { SlackService } from "src/infrastructure/adapters/slack/slack.service";
import { UpdateTicketTypeDto } from "./updateTicketType.dto";

@Injectable()
export class UpdateTicketTypeService {
  constructor(
    @Inject('TicketTypeRepository') private readonly ticketTypeRepository: TicketTypeRepository,
    @Inject('ShowingRepository') private readonly showingRepository: ShowingRepository,
    private readonly slackService: SlackService,
    private readonly checkUserExistService: CheckUserExistService, 
  ) {}

  async execute(dto: UpdateTicketTypeDto, id: string, userEmail: string): Promise<Result<string, Error>> {
    try {
      const ticketType = await this.ticketTypeRepository.findOneById(id);
      if (!ticketType) {
        return Err(new Error('Ticket type not found'));
      }

      const userExists = await this.checkUserExistService.execute(userEmail);
      if (!userExists) {
        return Err(new Error('User does not exist'));
      }

      const isAuthor = await this.showingRepository.checkAuthor(ticketType.showingId, userEmail);
      if (isAuthor.isErr()) {
        return Err(new Error(isAuthor.unwrapErr().message));
      }

      if (!isAuthor.unwrap()) {
        return Err(new Error('You do not have permission to update ticket type'));
      }

      const result = await this.ticketTypeRepository.updateTicketType(dto, id, userEmail);
      if (result.isErr()) {
        return Err(new Error(result.unwrapErr().message));
      }

      const showing = await this.showingRepository.findOneById(ticketType.showingId);

      const [ticketTypeId, isApproved] = result.unwrap();
      if (isApproved) {
        this.slackService.sendNotice(`Event Service - Showing >>> UpdateShowingService: Event with ID ${showing.eventId} has been updated showing.`);
      }

      return Ok(ticketTypeId);
    } catch (error) {
      this.slackService.sendError(`Event Service - Ticket type >>> UpdateTicketTypeService: ${error.message}`);
      return Err(new Error(`Error updating showwing: ${error.message}`));
    }
  }
}