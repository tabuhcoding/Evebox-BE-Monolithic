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
      await this.slackService.sendError(`Event Service - Event summary >>> GetEventSummaryService: ${error.message}`);

      return Err(new Error('Failed to retrieve events'));
    }
  }

  async executeAI(showingId: string, userRequest?: string): Promise<Result<string, Error>> {
    try {
      const showing = await this.showingWithEventRepository.findOneById(showingId, {
        Events: true,
      });
      const result = await this.execute(showingId, showing.Events.organizerId);

      if (result.isErr()) {
        return Err(new Error(result.unwrapErr().message));
      }

      const data = result.unwrap();

      const payload = {
        data: data,
        query: userRequest || ""
      };

      const responseAI = await fetch(`${process.env.UTILS_URL}/revenue`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!responseAI.ok) {
        const errorData = await responseAI.json();
        return Err(new Error(errorData.detail || 'Failed to analyze revenue data'));
      }

      const responseAIData = await responseAI.json();

      return Ok(responseAIData.result);
    } catch (error) {
      await this.slackService.sendError(`Event Service - Event summary with AI >>> GetEventSummaryService: ${error.message}`);

      return Err(new Error('Internal server error'));
    }
  }
}
