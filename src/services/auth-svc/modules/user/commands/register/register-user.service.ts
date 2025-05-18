import { Injectable } from '@nestjs/common';
import { RegisterUserCommand } from './register-user.command';
import { Email } from '../../domain/value-objects/user/email.vo';
import { Password } from '../../domain/value-objects/user/password.vo';
import { Name } from '../../domain/value-objects/user/name.vo';
import { Phone } from '../../domain/value-objects/user/phone.vo';
import { ProvinceId } from '../../domain/value-objects/user/province-id.vo';
import { UserRole } from '../../domain/enums/user-role.enum';
import { Role } from '../../domain/value-objects/user/role.vo';
import { Result, Ok, Err } from 'oxide.ts';
import { UserRepositoryImpl } from 'src/services/auth-svc/repository/users/user.repository.impl';
import { TempUserStore } from 'src/infrastructure/local-storage/local-storage.service';
import { OTPType } from '../../domain/enums/otp-type.enum';
import { OtpUtils } from 'src/shared/utils/otp/otp.util';
import { OTP } from '../../domain/entities/otp.entity';
import { USER_MESSAGES } from 'src/shared/constants/constants';

@Injectable()
export class RegisterUserService {
  constructor(
    private readonly authRepository: UserRepositoryImpl,
    private readonly temUserRepository: TempUserStore,
    private readonly otpUtils: OtpUtils,
  ) {}

  async execute(
    command: RegisterUserCommand,
  ): Promise<
    Result<
      {
        request_token: string;
        remaining_attempts: number;
        resend_allowed_in: number;
      },
      Error
    >
  > {
    try {
      const emailOrError = Email.create(command.email);
      if (emailOrError.isErr()) {
        return Err(emailOrError.unwrapErr());
      }
      const email = emailOrError.unwrap();

      const existingUser = await this.authRepository.findByEmail(email);
      if (existingUser) {
        return Err(new Error(USER_MESSAGES.ERRORS.EMAIL_EXISTS));
      }

      const nameOrError = Name.create(command.name);
      if (nameOrError.isErr()) {
        return Err(nameOrError.unwrapErr());
      }
      const name = nameOrError.unwrap();

      const phoneOrError = Phone.create(command.phone);
      if (phoneOrError.isErr()) {
        return Err(phoneOrError.unwrapErr());
      }
      const phone = phoneOrError.unwrap();

      const provinceIdsOrError = ProvinceId.createList(command.province_id);
      if (provinceIdsOrError.isErr()) {
        return Err(provinceIdsOrError.unwrapErr());
      }
      const provinceIds = provinceIdsOrError.unwrap();

      const roleOrError = Role.create(
        command.role_id ? command.role_id : UserRole.CUSTOMER,
      );
      if (roleOrError.isErr()) {
        return Err(roleOrError.unwrapErr());
      }
      const role = roleOrError.unwrap();

      if (command.re_password !== command.password) {
        return Err(new Error(USER_MESSAGES.ERRORS.PASSWORDS_MISMATCH));
      }

      const passwordOrError = await Password.create(command.password);
      if (passwordOrError.isErr()) {
        return Err(passwordOrError.unwrapErr());
      }
      const password = passwordOrError.unwrap();

      const otpResult = OTP.create(email, OTPType.REGISTER);

      if (otpResult.isErr()) {
        return Err(otpResult.unwrapErr());
      }

      const otp = otpResult.unwrap();

      const requestToken = this.otpUtils.generateRequestToken(
        otp.email.value,
        OTPType[otp.type],
      );

      // Save OTP to database
      await this.authRepository.saveOTP(otp, requestToken);

      await this.temUserRepository.save(
        requestToken,
        { name, email, password, phone, provinceIds, role },
        900,
      );
      
      return Ok({
        request_token: requestToken,
        remaining_attempts: otp.getRemainingAttempts(),
        resend_allowed_in: otp.resendCooldown,
      });
    } catch (error) {
      return Err(
        new Error(USER_MESSAGES.ERRORS.REGISTER_ERROR),
      );
    }
  }
}
