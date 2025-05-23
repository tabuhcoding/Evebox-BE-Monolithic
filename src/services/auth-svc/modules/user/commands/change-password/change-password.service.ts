import { Inject, Injectable } from "@nestjs/common";
import { Result, Ok, Err } from "oxide.ts";
import { UserRepository } from "src/services/auth-svc/repository/users/user.repository";
import { Password } from "../../domain/value-objects/user/password.vo";
import { USER_MESSAGES } from "src/shared/constants/constants";
import { Email } from "../../domain/value-objects/user/email.vo";
import { ChangePasswordDto } from "./change-password.dto";
import { SlackService } from "src/infrastructure/adapters/slack/slack.service";

@Injectable()
export class ChangePasswordService {
  constructor(
    @Inject('UserRepository') private readonly userRepository: UserRepository,
    private readonly slackService: SlackService
  ) {}

  async execute(dto: ChangePasswordDto, email: string): Promise<Result<void, Error>> {
    try {
      if (dto.newPassword !== dto.confirmPassword) {
        return Err(new Error(USER_MESSAGES.ERRORS.PASSWORDS_MISMATCH));
      }

      const userEmailOrError = Email.create(email);
      if (userEmailOrError.isErr()) {
        return Err(userEmailOrError.unwrapErr());
      }
      const userEmailVo = userEmailOrError.unwrap();

      const user = await this.userRepository.findByEmail(userEmailVo);
      if (!user) {
        return Err(new Error(USER_MESSAGES.ERRORS.USER_NOT_FOUND));
      }

      const isOldPasswordValid = await user.password.comparePassword(
        dto.oldPassword,
      );
      if (!isOldPasswordValid) {
        return Err(new Error(USER_MESSAGES.ERRORS.INVALID_OLD_PASSWORD));
      }

      const passwordOrError = await Password.create(dto.newPassword);
      if (passwordOrError.isErr()) {
        return Err(passwordOrError.unwrapErr());
      }
      const newPassword = passwordOrError.unwrap();

      // Update user's password
      user.updatePassword(newPassword);

      // Save updated user
      await this.userRepository.save(user);

      // Revoke all refresh tokens for security
      await this.userRepository.revokeAllRefreshTokens(user.email.value);

      return Ok(void 0);
    } catch (error) {
      this.slackService.sendError(`AuthSvc - User >>> ChangePasswordService: ${error.message}`);
      return Err(new Error(USER_MESSAGES.ERRORS.CHANGE_PASSWORD_FAILED));
    }
  }
}