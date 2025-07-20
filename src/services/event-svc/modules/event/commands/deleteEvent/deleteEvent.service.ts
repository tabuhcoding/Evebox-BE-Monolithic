import { Inject, Injectable } from "@nestjs/common";
import { Result, Ok, Err } from "oxide.ts";

import { EventsRepository } from "src/services/event-svc/repository/events/events.repo";
import { EVENT_ROLE } from "../../domain/eventRole";
import { DeleteEventResponseData } from "./deleteEvent-response.dto";
import { SlackService } from "src/infrastructure/adapters/slack/slack.service";
import { CheckUserExistService } from "src/services/auth-svc/modules/user/commands/checkuserExist/checkuserExist.service";

@Injectable()
export class DeleteEventService {
  constructor(
    @Inject('EventsRepository') private readonly eventsRepository: EventsRepository,
    private readonly slackService: SlackService,
    private readonly checkUserExistService: CheckUserExistService, 
  ) {}

  async execute(id: number, email: string): Promise<Result<DeleteEventResponseData, Error>> {
    try {
      // Check if the user exists
      const userExists = await this.checkUserExistService.execute(email);
      if (!userExists) {
        return Err(new Error('User does not exist'));
      }
      
      const hasPermisison = await this.eventsRepository.hasPermissionToManageEvent(id>>0, email, EVENT_ROLE.IS_EDITED);
      if (hasPermisison.isErr()) {
        console.error('Failed to check permission');
        return Err(new Error(hasPermisison.unwrapErr().message));
      }

      if (!hasPermisison.unwrap()) {
        return Err(new Error('Unauthorized'));
      }

      const eventId = await this.eventsRepository.deleteEvent(Number(id));
      if (!eventId) {
        return Err(new Error('Failed to update event'));
      }

      return Ok({ id: eventId });
    } catch (error) {
      await this.slackService.sendError(`EventSvc - Event >>> DeleteEventService: ${error.message}`);
      return Err(new Error(`Error updating event: ${error.message}`));
    }
  }
}