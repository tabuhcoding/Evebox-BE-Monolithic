import { Inject, Injectable } from "@nestjs/common";
import { Result, Ok, Err } from "oxide.ts";

import { EventsRepository } from "src/services/event-svc/repository/events/events.repo";
import { EventOrgDetailResponseDto } from "./getEventOfOrgDetail-response.dto";
import { SlackService } from "src/infrastructure/adapters/slack/slack.service";
import { CheckUserExistService } from "src/services/auth-svc/modules/user/commands/checkuserExist/checkuserExist.service";
import { EVENT_ROLE } from "../../domain/eventRole";

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

      const hasPermission = await this.eventsRepository.hasPermissionToManageEvent(eventId, organizerId, EVENT_ROLE.IS_SUMMARIZED);
      if (hasPermission.isErr()) {
        return Err(new Error('Failed to check permission'));
      }

      if (!hasPermission) {
        return Err(new Error('You do not have permission to get detail of org'));
      }

      const result = await this.eventsRepository.getEventOfOrgDetail(eventId);
      if (result.isErr()) {
        return Err(new Error(result.unwrapErr().message));
      }

      return Ok(result.unwrap());
    } catch (error) {
      this.slackService.sendError(`Event Service - Event detail of org >>> GetEventOfOrgdetailService: ${error.message}`);

      return Err(new Error('Failed to retrieve detail of event of org'));
    }
  }
}