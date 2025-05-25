import { Inject, Injectable } from "@nestjs/common";
import { Result, Ok, Err } from "oxide.ts";
import { AdminRepository } from "src/services/auth-svc/repository/admin/admin.repository";
import { UserRepository } from "src/services/auth-svc/repository/users/user.repository";
import { UpdateUserStatusDto } from "./updateUserStatus.dto";
import { SlackService } from "src/infrastructure/adapters/slack/slack.service";
import { USER_MESSAGES, ADMIN_MESSAGES } from "src/shared/constants/constants";
import { Status } from "../../../user/domain/value-objects/user/status.vo";
import { Email } from "../../../user/domain/value-objects/user/email.vo";

@Injectable()
export class UpdateUserStatusService {
  constructor(
    @Inject('AdminRepository') private readonly adminRepository: AdminRepository,
    @Inject('UserRepository') private readonly userRepository: UserRepository,
    private readonly slackService: SlackService
  ) { }

  async execute(dto: UpdateUserStatusDto, userId: string, email: string): Promise<Result<void, Error>> {
    try {
      const emailOrError = Email.create(userId);
      if (emailOrError.isErr()) {
        return Err(emailOrError.unwrapErr());
      }

      const emailUnwrapped = emailOrError.unwrap();

      const user = await this.userRepository.findByEmail(emailUnwrapped);
      if (!user) {
        return Err(new Error(USER_MESSAGES.ERRORS.USER_NOT_FOUND));
      }

      const emailAdminOrError = Email.create(email);
      if (emailAdminOrError.isErr()) {
        return Err(emailAdminOrError.unwrapErr());
      }

      const emailAdminUnwrapped = emailAdminOrError.unwrap();

      const admin = await this.userRepository.findByEmail(emailAdminUnwrapped)

      if (!admin || !admin.role.isAdmin) {
        return Err(new Error(ADMIN_MESSAGES.ERRORS.NO_PERMISSION));
      }

      const statusOrError = Status.create(dto.status);
      if (statusOrError.isErr()) {
        return Err(statusOrError.unwrapErr());
      }

      await this.adminRepository.updateUserStatus(email, dto.status);

      return Ok(void 0);
    } catch (error) {
      this.slackService.sendError(`AuthSvc >>> User - UpdateUserStatusService: ${error.message}`);
      return Err(new Error(USER_MESSAGES.ERRORS.SERVER_ERROR));
    }
  }
}