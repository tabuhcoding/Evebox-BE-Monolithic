import { Inject, Injectable } from "@nestjs/common";
import { Result, Ok, Err } from "oxide.ts";
import { AdminRepository } from "src/services/auth-svc/repository/admin/admin.repository";
import { UserRepository } from "src/services/auth-svc/repository/users/user.repository";
import { UpdateUserRoleDto } from "./updateUserRole.dto";
import { SlackService } from "src/infrastructure/adapters/slack/slack.service";
import { ADMIN_MESSAGES, USER_MESSAGES } from "src/shared/constants/constants";
import { Role } from "../../../user/domain/value-objects/user/role.vo";
import { Email } from "../../../user/domain/value-objects/user/email.vo";
import { UserRole } from "../../../user/domain/enums/user-role.enum";

@Injectable()
export class UpdateUserRoleService {
  constructor(
    @Inject('AdminRepository') private readonly adminRepository: AdminRepository,
    @Inject('UserRepository') private readonly userRepository: UserRepository,
    private readonly slackService: SlackService
  ) { }

  async execute(dto: UpdateUserRoleDto, userId: string, email: string): Promise<Result<void, Error>> {
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

      const roleOrError = Role.create(dto.role);
      if (roleOrError.isErr()) {
        return Err(roleOrError.unwrapErr());
      }

      await this.adminRepository.updateUserRole(userId, dto.role);

      return Ok(void 0);
    } catch (error) {
      this.slackService.sendError(`AuthSvc >>> User - UpdateUserRoleService: ${error.message}`);
      return Err(new Error(USER_MESSAGES.ERRORS.SERVER_ERROR));
    }
  }
}