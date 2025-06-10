import { Inject, Injectable } from "@nestjs/common";
import { Result, Ok, Err } from "oxide.ts";

import { EventsRepository } from "src/services/event-svc/repository/events/events.repo";
import { ShowingWithEventRepository } from "src/services/event-svc/repository/showing/showingWithEvent.repo";
import { EventSummaryData } from "./getEventSummary-response.dto";
import { EVENT_ROLE } from "../../domain/eventRole";
import { SlackService } from "src/infrastructure/adapters/slack/slack.service";
import { CheckUserExistService } from "src/services/auth-svc/modules/user/commands/checkuserExist/checkuserExist.service";

@Injectable()
export class GetEventSummaryService {
  constructor(
    @Inject('EventsRepository') private readonly eventRepository: EventsRepository,
    @Inject('ShowingWithEventRepository') private readonly showingWithEventRepository: ShowingWithEventRepository,
    private readonly slackService: SlackService,    
    private readonly checkUserExistService: CheckUserExistService,
  ) {}

  async execute(showingId: string, organizerId: string): Promise<Result<EventSummaryData, Error>> {
    try {
      const userExists = await this.checkUserExistService.execute(organizerId);
      if (!userExists) {
        return Err(new Error('User does not exist'));
      }

      const showing = await this.showingWithEventRepository.findOneById(showingId);
      if (!showing) {
        return Err(new Error('Showing not found'));
      }

      const canSummarized = await this.eventRepository.hasPermissionToManageEvent(showing.eventId, organizerId, EVENT_ROLE.IS_SUMMARIZED);
      if (canSummarized.isErr()) {
        return Err(new Error(canSummarized.unwrapErr().message));
      }

      if (!canSummarized.unwrap()) {
        return Err(new Error('You do not have permisison to get event summary'));
      }

      const result = await this.eventRepository.getEventSummary(showingId);
      if (result.isErr()) {
        return Err(new Error(result.unwrapErr().message));
      }

      return result;
    } catch (error) {
      this.slackService.sendError(`Event Service - Event summary >>> GetEventSummaryService: ${error.message}`);

      return Err(new Error('Failed to retrieve events'));
    }
  }
}