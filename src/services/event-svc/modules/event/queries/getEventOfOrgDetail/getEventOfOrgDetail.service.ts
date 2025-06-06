import { Inject, Injectable } from "@nestjs/common";
import { Result, Ok, Err } from "oxide.ts";

import { EventsRepository } from "src/services/event-svc/repository/events/events.repo";
import { EventOrgDetailResponseDto } from "./getEventOfOrgDetail-response.dto";
import { SlackService } from "src/infrastructure/adapters/slack/slack.service";
import { CheckUserExistService } from "src/services/auth-svc/modules/user/commands/checkuserExist/checkuserExist.service";

@Injectable()
export class GetEventOfOrgDetailService {
  constructor(
    @Inject('EventsRepository') private readonly eventsRepository: EventsRepository,
    private readonly slackService: SlackService,
    private readonly checkUserExistService: CheckUserExistService
  ) {}

  async execute(eventId: number, organizerId: string): Promise<Result<EventOrgDetailResponseDto, Error>> {
    try {
      const userExists = await this.checkUserExistService.execute(organizerId);
      if (!userExists) {
        return Err(new Error('User does not exist'));
      }

      const result = await this.eventsRepository.getEventOfOrgDetail(eventId, organizerId);
      if (result.isErr()) {
        return Err(new Error(result.unwrapErr().message));
      }

      return result;
    } catch (error) {
      this.slackService.sendError(`Event Service - Event detail of org >>> GetEventOfOrgdetailService: ${error.message}`);

      return Err(new Error('Failed to retrieve events'));
    }
  }
}