import { Inject, Injectable } from "@nestjs/common";
import { Result, Ok, Err } from "oxide.ts";

import { OrgPaymentInforRepository } from "src/services/event-svc/repository/orgPaymentInfor/orgPaymentInfor.repo";
import { UpdateOrgPaymentInfoDto } from "./updateOrgPaymentInfor.dto";
import { CheckUserExistService } from "src/services/auth-svc/modules/user/commands/checkuserExist/checkuserExist.service";
import { SlackService } from "src/infrastructure/adapters/slack/slack.service";

@Injectable()
export class UpdateOrgPaymentInfoService {
  constructor(
    @Inject('OrgPaymentInforRepository') private readonly orgPaymentInforRepository: OrgPaymentInforRepository,
    private readonly slackService: SlackService,
    private readonly checkUserExistService: CheckUserExistService,
  ) {}

  async execute(dto: UpdateOrgPaymentInfoDto, id: string, userEmail: string): Promise<Result<string, Error>> {
    try {
      const existing = await this.orgPaymentInforRepository.findOneById(id);
      if (!existing) {
        return Err(new Error(`Payment info of ${userEmail} not found`));
      }

      const userExists = await this.checkUserExistService.execute(userEmail);
      if (!userExists) {
        return Err(new Error('User does not exist'));
      }

      if (existing.organizerId !== userEmail) {
        return Err(new Error('You do not have permission to update this payment info'));
      }

      const result = await this.orgPaymentInforRepository.updateOrgPaymentInfo(dto, id, userEmail);
      if (result.isErr()) {
        return Err(new Error(result.unwrapErr().message));
      }

      return result;
    } catch (error) {
      this.slackService.sendError(`Event Service - OrgPaymentInfo >>> UpdateOrgPaymentInfoService: ${error.message}`);
      return Err(new Error(`Error updating payment info: ${error.message}`));
    }
  }
}