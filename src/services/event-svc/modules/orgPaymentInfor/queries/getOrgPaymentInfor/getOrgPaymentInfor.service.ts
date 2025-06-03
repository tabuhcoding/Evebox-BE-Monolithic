import { Inject, Injectable } from "@nestjs/common";
import { Result, Ok, Err } from "oxide.ts";

import { OrgPaymentInforRepository } from "src/services/event-svc/repository/orgPaymentInfor/orgPaymentInfor.repo";
import { OrgPaymentInfoData } from "./getOrgPaymentInfor-response.dto";
import { SlackService } from "src/infrastructure/adapters/slack/slack.service";
import { CheckUserExistService } from "src/services/auth-svc/modules/user/commands/checkuserExist/checkuserExist.service";

@Injectable()
export class GetOrgPaymentInfoService {
  constructor(
    @Inject('OrgPaymentInforRepository') private readonly orgPaymentInforRepository: OrgPaymentInforRepository,
    private readonly slackService: SlackService,
    private readonly checkUserExistService: CheckUserExistService
  ) {}

  async execute(userEmail: string): Promise<Result<OrgPaymentInfoData, Error>> {
    try {
      const userExists = await this.checkUserExistService.execute(userEmail);
      if (!userExists) {
        return Err(new Error('User does not exist'));
      }

      const paymentInfo = await this.orgPaymentInforRepository.findOne({
        organizerId: userEmail,
        isDeleted: false
      });

      return Ok(paymentInfo);
    } catch (error) {
      this.slackService.sendError(`Event Service - Payment info >>> GetOrgPaymentInfoService: ${error.message}`);
      
      return Err(new Error('Failed to fetch recommended events.'));
    }
  }
}