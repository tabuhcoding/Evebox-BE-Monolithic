import { Injectable } from '@nestjs/common';
import { Result, Ok, Err } from 'oxide.ts';
import { ResendOTPCommand } from './resend-otp.command';
import { TempUserStore } from 'src/infrastructure/local-storage/local-storage.service';
import { OTPType } from '../../../domain/enums/otp-type.enum';
import { UserRepositoryImpl } from 'src/services/auth-svc/repository/users/user.repository.impl';
import { OTP } from '../../../domain/entities/otp.entity';
import { Email } from '../../../domain/value-objects/user/email.vo';
import { OTP_MESSAGES } from 'src/shared/constants/constants';

@Injectable()
export class ResendOTPService {
  constructor(
    private readonly authRepository: UserRepositoryImpl,
    private readonly tempUserRepository: TempUserStore,
  ) {}

  async execute(
    command: ResendOTPCommand,
  ): Promise<Result<{ remaining_attempts: number; resend_allowed_in: number }, Error>> {
    // Validate email
    const emailOrError = Email.create(command.email);
    if (emailOrError.isErr()) {
      return Err(emailOrError.unwrapErr());
    }
    const email = emailOrError.unwrap();

    // Validate request token for registration
    if (command.type === OTPType.REGISTER) {
      const tempUser = await this.tempUserRepository.get(command.request_token);
      if (!tempUser) {
        return Err(new Error(OTP_MESSAGES.ERRORS.INVALID_REQUEST_TOKEN));
      }
    }
    
    // Create new OTP
    const otpResult = OTP.create(email, command.type);
    if (otpResult.isErr()) {
      return Err(otpResult.unwrapErr());
    }

    const otp = otpResult.unwrap();
    await this.authRepository.saveOTP(otp, command.request_token);

    return Ok({
      remaining_attempts: otp.getRemainingAttempts(),
      resend_allowed_in: otp.resendCooldown,
    });
  }
}