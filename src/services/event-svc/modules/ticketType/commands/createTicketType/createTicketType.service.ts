import { Inject, Injectable } from "@nestjs/common";
import { Result, Ok, Err } from "oxide.ts";

import { TicketTypeRepository } from "src/services/event-svc/repository/ticketType/ticketType.repo";
import { ShowingRepository } from "src/services/event-svc/repository/showing/showing.repo";
import { EventsRepository } from "src/services/event-svc/repository/events/events.repo";
import { CreateTicketTypeDto } from "./createTicketType.dto";
import { SlackService } from "src/infrastructure/adapters/slack/slack.service";
import { CheckUserExistService } from "src/services/auth-svc/modules/user/commands/checkuserExist/checkuserExist.service";

@Injectable()
export class CreateTicketTypeService {
  constructor(
    @Inject('TicketTypeRepository') private readonly ticketTypeRepository: TicketTypeRepository,
    @Inject('ShowingRepository') private readonly showingRepository: ShowingRepository,
    @Inject('EventsRepository') private readonly eventsRepository: EventsRepository,
    private readonly slackService: SlackService,
    private readonly checkUserExistService: CheckUserExistService
  ) {}

  async execute(dto: CreateTicketTypeDto, showingId: string, userEmail: string): Promise<Result<string, Error>> {
    try {
      const userExists = await this.checkUserExistService.execute(userEmail);
      if (!userExists) {
        return Err(new Error('User does not exist'));
      }

      const showing = await this.showingRepository.findOneById(showingId);
      if (!showing || showing.deleteAt !== null) {
        return Err(new Error('Showing not found or was deleted'));
      }

      const event = await this.eventsRepository.findOneById(Number(showing.eventId));

      if(!dto.startTime || !dto.endTime || dto.startTime >= dto.endTime) {
        return Err(new Error('Invalid start time or end time'));
      }

      const showingStartTime = new Date(showing.startTime);
      const ticketEndTime = new Date(dto.endTime);

      if (ticketEndTime >= showingStartTime) {
        return Err(new Error('Ticket end time must be earlier than showing start time'));
      }

      const result = await this.ticketTypeRepository.createTicketType(dto, showingId);
      if (result.isErr()) {
        return Err(new Error(result.unwrapErr().message));
      }

      const [ticketTypeId, isApproved] = result.unwrap();

      if (isApproved) {
        this.slackService.sendNotice(`Event Service - Showing >>> CreateTicketTypeService: Event with ID ${event.id} has been created ticket type.`);
      }

      return Ok(ticketTypeId);
    } catch (error) {
      this.slackService.sendError(`EventSvc - Showing >>> CreateTicketTypeService: ${error.message}`);

      return Err(new Error(`Failed to create ticket type: ${error.message}`));
    }
  }
}