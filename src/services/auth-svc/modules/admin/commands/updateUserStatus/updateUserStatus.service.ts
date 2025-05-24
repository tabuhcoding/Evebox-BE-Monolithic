import { Inject, Injectable } from "@nestjs/common";
import { Result, Ok, Err } from "oxide.ts";
import { AdminRepository } from "src/services/auth-svc/repository/admin/admin.repository";
import { UpdateUserStatusDto } from "./updateUserStatus.dto";
import { SlackService } from "src/infrastructure/adapters/slack/slack.service";
import { USER_MESSAGES } from "src/shared/constants/constants";

@Injectable()
export class UpdateUserStatusService {
  constructor(
    @Inject('AdminRepository') private readonly adminRepository: AdminRepository,
    private readonly slackService: SlackService
  ) {}

  async execute(dto: UpdateUserStatusDto, email: string): Promise<Result<void, Error>> {
    try {
      await this.adminRepository.updateUserStatus(email, dto.status);

      return Ok(void 0);
    } catch (error) {
      this.slackService.sendError(`AuthSvc >>> User - UpdateUserStatusService: ${error.message}`);
      return Err(new Error(USER_MESSAGES.ERRORS.SERVER_ERROR));
    }
  }
}