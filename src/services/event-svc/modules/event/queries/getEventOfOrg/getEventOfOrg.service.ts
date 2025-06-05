import { Inject, Injectable } from "@nestjs/common";
import { Result, Ok, Err } from "oxide.ts";

import { EventsRepository } from "src/services/event-svc/repository/events/events.repo";
import { EventOrgFrontDisplayDto } from "./getEventOfOrg-response.dto";
import { SlackService } from "src/infrastructure/adapters/slack/slack.service";
import { CheckUserExistService } from "src/services/auth-svc/modules/user/commands/checkuserExist/checkuserExist.service";

@Injectable()
export class GetEventOfOrgService {
  constructor(
    @Inject('EventsRepository') private readonly eventsRepository: EventsRepository,
    private readonly slackService: SlackService,
    private readonly checkUserExistService: CheckUserExistService
  ) {}

  async execute(organizerId: string): Promise<Result<EventOrgFrontDisplayDto[], Error>> {
    try {
      const userExists = await this.checkUserExistService.execute(organizerId);
      if (!userExists) {
        return Err(new Error('User does not exist'));
      }

      const result = await this.eventsRepository.getEventOfOrg(organizerId);
      if (result.isErr()) {
        return Err(new Error(result.unwrapErr().message));
      }

      return Ok(result.unwrap());
    } catch (error) {
      this.slackService.sendError(`Event Service - Event of org >>> GetEventOfOrgService: ${error.message}`);

      return Err(new Error('Failed to retrieve events'));
    }
  }
}