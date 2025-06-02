import { Inject, Injectable } from "@nestjs/common";
import { Result, Ok, Err } from "oxide.ts";

import { OrgPaymentInforRepository } from "src/services/event-svc/repository/orgPaymentInfor/orgPaymentInfor.repo";
import { CreateOrgPaymentInfoDto } from "./createOrgPaymentInfor.dto";
import { SlackService } from "src/infrastructure/adapters/slack/slack.service";
import { CheckUserExistService } from "src/services/auth-svc/modules/user/commands/checkuserExist/checkuserExist.service";

@Injectable()
export class CreateOrgPaymentInfoService {
  constructor(
    @Inject('OrgPaymentInforRepository') private readonly orgPaymentInforRepository: OrgPaymentInforRepository,
    private readonly slackService: SlackService,
    private readonly checkUserExistService: CheckUserExistService
  ) {}

  async execute (dto: CreateOrgPaymentInfoDto, organizerId: string): Promise<Result<string, Error>> {
    try {
      const userExists = await this.checkUserExistService.execute(organizerId);
      if (!userExists) {
        return Err(new Error('User does not exist'));
      }

      if (!dto.accountName.trim() || !dto.accountNumber.trim() || !dto.bankName.trim() || !dto.branch.trim()) {
        return Err(new Error('Bank account information is required.'));
      }
      if (!dto.fullName || !dto.address || !dto.taxCode) {
        return Err(new Error('FullName, Address, and Tax code are required.'));
      }

      const existing = await this.orgPaymentInforRepository.findOne({ organizerId });
      if (existing) {
        return Err(new Error('A payment record for this organizer already exists.'));
      }

      const result = await this.orgPaymentInforRepository.createOrgPaymentInfo(dto, organizerId);
      if (result.isErr()) {
        return Err(new Error(result.unwrapErr().message));
      }

      return result;
    } catch (error) {
      this.slackService.sendError(`EventSvc - OrgPaymentInfo >>> CreateOrgPaymentInfoService: ${error.message}`);
      return Err(new Error(`Failed to create organizer payment info: ${error.message}`));
    }
  }
}