import { Inject, Injectable } from "@nestjs/common";
import { Result, Ok, Err } from "oxide.ts";

import { EventRoleRepository } from "src/services/event-svc/repository/eventRole/eventRole.repo";
import { EventRoleItemDto } from "./getEventRoles-response.dto";
import { SlackService } from "src/infrastructure/adapters/slack/slack.service";
import { CheckUserExistService } from "src/services/auth-svc/modules/user/commands/checkuserExist/checkuserExist.service";
import { GetUserService } from "src/services/auth-svc/modules/user/queries/get-user/get-user.service";

@Injectable()
export class GetEventRolesService {
  constructor(
    @Inject('EventRoleRepository') private readonly eventRoleRepository: EventRoleRepository,
    private readonly slackService: SlackService,
    private readonly checkUserExistService: CheckUserExistService,
    private readonly getUserService: GetUserService,
  ) { }

  async execute(userEmail: string): Promise<Result<EventRoleItemDto[], Error>> {
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

      const roles = await this.eventRoleRepository.findMany({}, undefined, {
        id: 'asc',
      });

      const resRoles = roles.map(role => ({
        role: role.id,
        isEdited: role.isEdited,
        isSummarized: role.isSummarized,
        viewVoucher: role.viewVoucher,
        marketing: role.marketing,
        viewOrder: role.viewOrder,
        viewSeatmap: role.viewSeatmap,
        viewMember: role.viewMember,
        checkin: role.checkin,
        checkout: role.checkout,
        redeem: role.redeem,
      }));

      return Ok(resRoles);
    } catch (error) {
      this.slackService.sendError(`Event Service - Event role >>> GetEventRolesService: ${error.message}`);

      return Err(new Error('Failed to retrieve events'));
    }
  }
}