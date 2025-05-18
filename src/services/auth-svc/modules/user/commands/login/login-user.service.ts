import { Injectable } from '@nestjs/common';
import { LoginUserCommand } from './login-user.command';
import { JwtService } from '@nestjs/jwt';
import { Result, Ok, Err } from 'oxide.ts';
import { Email } from '../../domain/value-objects/user/email.vo';
import { UserRepositoryImpl } from 'src/services/auth-svc/repository/users/user.repository.impl';
import { ConfigService } from '@nestjs/config';
import { USER_MESSAGES } from 'src/shared/constants/constants';

@Injectable()
export class LoginUserService {
  constructor(
    private readonly userRepository: UserRepositoryImpl,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async execute(
    command: LoginUserCommand,
  ): Promise<Result<{ access_token: string; refresh_token: string }, Error>> {
    const emailOrError = Email.create(command.email);
    if (emailOrError.isErr()) {
      return Err(emailOrError.unwrapErr());
    }
    const email = emailOrError.unwrap();
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      return Err(new Error(USER_MESSAGES.ERRORS.LOGIN_FAILED));
    }

    const passwordMatches = await user.password.comparePassword(
      command.password,
    );
    if (!passwordMatches) {
      return Err(new Error(USER_MESSAGES.ERRORS.LOGIN_FAILED));
    }

    // Generate Access Token
    const payload = { email: user.email.value, role: user.role.getValue() };
    const accessToken = this.jwtService.sign(payload);

    // Generate Refresh Token
    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRES_IN'),
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
    });
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    await this.userRepository.saveRefreshToken(
      refreshToken,
      user.email.value,
      expiresAt,
    );

    return Ok({ access_token: accessToken, refresh_token: refreshToken });
  }
}
