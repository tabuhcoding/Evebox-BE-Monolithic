import { Injectable } from '@nestjs/common';
import { Result, Ok, Err } from 'oxide.ts';
import { Email } from '../../domain/value-objects/user/email.vo';
import { UserRepositoryImpl } from 'src/services/auth-svc/repository/users/user.repository.impl';
import { ForgotPasswordUserCommand } from './forgot-password.command';
import { OTPType } from '../../domain/enums/otp-type.enum';
import { OTP } from '../../domain/entities/otp.entity';
import { OtpUtils } from 'src/shared/utils/otp/otp.util';
import { USER_MESSAGES } from 'src/shared/constants/constants';

@Injectable()
export class ForgotPasswordUserService {
  constructor(
    private readonly authRepository: UserRepositoryImpl,
    private readonly otpUtils: OtpUtils,
  ) {}

  async execute(command: ForgotPasswordUserCommand): Promise<
    Result<
      {
        request_token: string;
        remaining_attempts: number;
        resend_allowed_in: number;
      },
      Error
    >
  > {
    // Validate email
    const emailOrError = Email.create(command.email);
    if (emailOrError.isErr()) {
      return Err(emailOrError.unwrapErr());
    }
    const email = emailOrError.unwrap();

    // Check if user exists
    const user = await this.authRepository.findByEmail(email);
    if (!user) {
      return Err(new Error(USER_MESSAGES.ERRORS.USER_NOT_FOUND));
    }

    // Create OTP and trigger domain event
    const otpResult = OTP.create(email, OTPType.FORGOT_PASSWORD);

    if (otpResult.isErr()) {
      return Err(otpResult.unwrapErr());
    }

    const otp = otpResult.unwrap();

    const requestToken = this.otpUtils.generateRequestToken(
      otp.email.value,
      OTPType[otp.type],
    );

    // Save user with new domain event
    await this.authRepository.save(user);

    // Save OTP to database
    await this.authRepository.saveOTP(otp, requestToken);

    return Ok({
      request_token: requestToken,
      remaining_attempts: otp.getRemainingAttempts(),
      resend_allowed_in: otp.resendCooldown,
    });
  }
}
