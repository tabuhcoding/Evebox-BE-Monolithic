import { Inject, Injectable } from "@nestjs/common";
import { Result, Ok, Err } from "oxide.ts";

import { EventsRepository } from "src/services/event-svc/repository/events/events.repo";
import { DeleteEventResponseData } from "./deleteEvent-response.dto";
import { SlackService } from "src/infrastructure/adapters/slack/slack.service";

@Injectable()
export class DeleteEventService {
  constructor(
    @Inject('EventsRepository') private readonly eventsRepository: EventsRepository,
    private readonly slackService: SlackService
  ) {}

  async execute(id: number, email: string): Promise<Result<DeleteEventResponseData, Error>> {
    try {
      const hasPermisison = await this.eventsRepository.hasPermissionToManageEvent(Number(id), email);
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
      this.slackService.sendError(`EventSvc - Event >>> DeleteEventService: ${error.message}`);
      return Err(new Error(`Error updating event: ${error.message}`));
    }
  }
}