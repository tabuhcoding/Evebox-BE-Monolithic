import { Injectable } from '@nestjs/common';
import { Result, Ok, Err } from 'oxide.ts';
import { UserRepositoryImpl } from 'src/services/auth-svc/repository/users/user.repository.impl';
import { ResetPasswordCommand } from './reset-password.command';
import { Password } from '../../domain/value-objects/user/password.vo';
import { Email } from '../../domain/value-objects/user/email.vo';
import { RESET_TOKEN_MESSAGES, USER_MESSAGES } from 'src/shared/constants/constants';

@Injectable()
export class ResetPasswordService {
  constructor(
    private readonly userRepository: UserRepositoryImpl,
  ) {}

  async execute(
    command: ResetPasswordCommand,
  ): Promise<Result<void, Error>> {
    try {
      // Validate password match
      if (command.newPassword !== command.confirmPassword) {
        return Err(new Error(USER_MESSAGES.ERRORS.PASSWORDS_MISMATCH));
      }

      // Parse reset token to get email
      const [email] = command.resetToken.split('_');
      if (!email) {
        return Err(new Error(RESET_TOKEN_MESSAGES.ERRORS.INVALID_RESET_TOKEN));
      }

      // Create email value object
      const emailOrError = Email.create(email);
      if (emailOrError.isErr()) {
        return Err(emailOrError.unwrapErr());
      }
      const emailVo = emailOrError.unwrap();

      // Find user by email
      const user = await this.userRepository.findByEmail(emailVo);
      if (!user) {
        return Err(new Error(USER_MESSAGES.ERRORS.USER_NOT_FOUND));
      }

      // Create new password value object
      const passwordOrError = await Password.create(command.newPassword);
      if (passwordOrError.isErr()) {
        return Err(passwordOrError.unwrapErr());
      }
      const newPassword = passwordOrError.unwrap();

      // Update user's password
      user.updatePassword(newPassword);

      // Save updated user
      await this.userRepository.save(user);

      // Revoke all refresh tokens
      await this.userRepository.revokeAllRefreshTokens(user.email.value);

      return Ok(void 0);
    } catch (error) {
      return Err(new Error(USER_MESSAGES.ERRORS.RESET_PASSWORD_FAILED));
    }
  }
}