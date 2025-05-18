import { Injectable } from '@nestjs/common';
import { GoogleLoginCommand } from './google-login.command';
import { JwtService } from '@nestjs/jwt';
import { Result, Ok, Err } from 'oxide.ts';
import { UserRepositoryImpl } from 'src/services/auth-svc/repository/users/user.repository.impl';
import { ConfigService } from '@nestjs/config';
import { User } from '../../domain/entities/user.entity';
import { Name } from '../../domain/value-objects/user/name.vo';
import { Email } from '../../domain/value-objects/user/email.vo';
import { Password } from '../../domain/value-objects/user/password.vo';
import { UserRole } from '../../domain/enums/user-role.enum';
import { Phone } from '../../domain/value-objects/user/phone.vo';
import { ProvinceId } from '../../domain/value-objects/user/province-id.vo';
import { USER_MESSAGES } from 'src/shared/constants/constants';

@Injectable()
export class GoogleLoginService {
  constructor(
    private readonly authRepository: UserRepositoryImpl,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async execute(
    command: GoogleLoginCommand,
  ): Promise<Result<{ access_token: string; refresh_token: string }, Error>> {
    const emailOrError = Email.create(command.email);
    if (emailOrError.isErr()) {
      return Err(emailOrError.unwrapErr());
    }
    const email = emailOrError.unwrap();

    const nameOrError = Name.create(command.fullname);
    if (nameOrError.isErr()) {
      return Err(nameOrError.unwrapErr());
    }
    const name = nameOrError.unwrap();

    const password = (await Password.create('google')).unwrap();

    const phoneOrError = Phone.create('0123456789');
    if (phoneOrError.isErr()) {
      return Err(phoneOrError.unwrapErr());
    }
    const phone = phoneOrError.unwrap();

    const provinceIdsOrError = ProvinceId.createList([]);
    if (provinceIdsOrError.isErr()) {
      return Err(provinceIdsOrError.unwrapErr());
    }
    const provinceIds = provinceIdsOrError.unwrap();

    let user = await this.authRepository.findByEmail(email);

    if (!user) {
      const userOrError = await User.createNew(
        name,
        email,
        password,
        phone,
        provinceIds,
        UserRole.CUSTOMER,
      );
      if (userOrError.isErr()) {
        return Err(new Error(USER_MESSAGES.ERRORS.FAILED_CREATE_USER));
      }
      const newUser = userOrError.unwrap();

      await this.authRepository.save(newUser);

      user = await this.authRepository.findByEmail(email);
      if (!user) {
        return Err(new Error(USER_MESSAGES.ERRORS.USER_NOT_FOUND));
      }
    }

    // Generate Access Token
    const payload = { email: user.email.value, role: user.role.getValue() };
    const accessToken = this.jwtService.sign(payload);

    // Generate Refresh Token
    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRES_IN'), // Refresh token expires in 7 days
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
    });

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await this.authRepository.saveRefreshToken(
      refreshToken,
      user.email.value,
      expiresAt, 
    );

    return Ok({ access_token: accessToken, refresh_token: refreshToken });
  }
}
