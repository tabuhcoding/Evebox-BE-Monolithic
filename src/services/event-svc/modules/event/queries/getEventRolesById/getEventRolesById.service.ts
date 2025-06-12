import { Inject, Injectable } from "@nestjs/common";
import { Result, Ok, Err } from "oxide.ts";

import { EventRoleRepository } from "src/services/event-svc/repository/eventRole/eventRole.repo";
import { EventRoleDetailDto } from "./getEventRolesById-response.dto";
import { SlackService } from "src/infrastructure/adapters/slack/slack.service";
import { CheckUserExistService } from "src/services/auth-svc/modules/user/commands/checkuserExist/checkuserExist.service";
import { GetUserService } from "src/services/auth-svc/modules/user/queries/get-user/get-user.service";

@Injectable()
export class GetEventRolesByIdService {
  constructor(
    @Inject('EventRoleRepository') private readonly eventRoleRepository: EventRoleRepository,
    private readonly slackService: SlackService,
    private readonly checkUserExistService: CheckUserExistService,
    private readonly getUserService: GetUserService,
  ) { }

  async execute(roleId: number, userEmail: string): Promise<Result<EventRoleDetailDto, Error>> {
    try {
      const userExists = await this.checkUserExistService.execute(userEmail);
      if (!userExists) {
        return Err(new Error('User does not exist'));
      }

      const user = await this.getUserService.execute(userEmail);
      if (user.isErr()) {
        return Err(new Error(user.unwrapErr().message));
      }

      const userRole = user.unwrap().role;

      if (userRole !== 1 && userRole !== 2) {
        return Err(new Error('Forbidden: Only organizers allowed'));
      }

      const role = await this.eventRoleRepository.findOneById(roleId)
      if (!role) {
        return Err(new Error(`Role with ID ${roleId} not found`))
      }

      return Ok(role)
    } catch (error) {
      await this.slackService.sendError(`Event Service - Event role by id >>> GetEventRolesByIdService: ${error.message}`);

      return Err(new Error('Failed to retrieve events'));
    }
  }
}