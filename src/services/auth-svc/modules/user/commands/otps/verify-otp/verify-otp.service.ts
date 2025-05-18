import { Injectable } from '@nestjs/common';
import { Result, Ok, Err } from 'oxide.ts';
import { Email } from '../../../domain/value-objects/user/email.vo';
import { UserRepositoryImpl } from 'src/services/auth-svc/repository/users/user.repository.impl';
import { VerifyOTPCommand } from './verify-otp.command';
import { OTPType } from '../../../domain/enums/otp-type.enum';
import { OtpUtils } from 'src/shared/utils/otp/otp.util';
import { TempUserStore } from 'src/infrastructure/local-storage/local-storage.service';
import { User } from '../../../domain/entities/user.entity';
import { OTP_MESSAGES, OTPConstants } from 'src/shared/constants/constants';

@Injectable()
export class VerifyOTPService {
  constructor(
    private readonly authRepository: UserRepositoryImpl,
    private readonly otpUtils: OtpUtils,
    private readonly tempUserRepository: TempUserStore,
  ) {}

  async execute(
    command: VerifyOTPCommand,
  ): Promise<Result<string, Error>> {
    // Validate command
    if (!command.type) {
      return Err(new Error(OTP_MESSAGES.ERRORS.TYPE_REQUIRED));
    }
    // Validate email
    const emailOrError = Email.create(command.email);
    if (emailOrError.isErr()) {
      return Err(emailOrError.unwrapErr());
    }
    const email = emailOrError.unwrap();

    // Find and validate OTP
    const otpData = await this.authRepository.findValidOTP(
      email.value,
      command.otp,
      command.type,
      command.request_token,
    );

    if (!otpData) {
      const OTPAttempts = await this.authRepository.getOTPAttempts(command.request_token);
      const remaining_attempts = OTPConstants.MAX_ATTEMPTS - OTPAttempts;
      if (remaining_attempts <= 0) {
        await this.authRepository.markOTPAsUsed(command.request_token);
        return Err(new Error(OTP_MESSAGES.ERRORS.MAX_ATTEMPTS_REACHED));
      }
      await this.authRepository.incrementOTPAttempts(command.request_token);
      return Err(new Error(OTP_MESSAGES.ERRORS.INVALID_OR_EXPIRED(remaining_attempts)));
    }

    // Check if user exists for forgot password
    // Or if email is already registered for registration
    if (command.type === OTPType.FORGOT_PASSWORD) {
      const user = await this.authRepository.findByEmail(email);

      if (!user) {
        return Err(new Error(OTP_MESSAGES.ERRORS.USER_NOT_FOUND));
      }

      // Generate verification token based on type
      const token = this.otpUtils.generateToken(email.value, command.type);
      // Mark OTP as used
      await this.authRepository.markOTPAsUsed(otpData.requestToken);
      return Ok(token);
    }

    if (command.type === OTPType.REGISTER) {
      const temp = await this.tempUserRepository.get(command.request_token);
      if (!temp) {
        return Err(new Error(OTP_MESSAGES.ERRORS.LOCAL_STORAGE_USER_NOT_FOUND));
      }
      
      const userOrError = await User.createNew(
        temp.name,
        temp.email,
        temp.password,
        temp.phone,
        temp.provinceIds,
        temp.role.getValue(), 
      );

      if (userOrError.isErr()) {
        return Err(userOrError.unwrapErr());
      }

      const user = userOrError.unwrap(); 

      await this.authRepository.save(user);
      await this.tempUserRepository.delete(command.request_token);
      
      // Mark OTP as used
      await this.authRepository.markOTPAsUsed(otpData.requestToken);
      return Ok(user.id.toString());
    }

    return Err(new Error(OTP_MESSAGES.ERRORS.INVALID_TYPE));
  }
}