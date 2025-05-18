import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserRepositoryImpl } from 'src/services/auth-svc/repository/users/user.repository.impl';
import { RefreshTokenCommand } from './refresh-token.command';
import { ConfigService } from '@nestjs/config';
import { Ok, Result, Err } from 'oxide.ts';

@Injectable()
export class RefreshTokenService {
  constructor(
    private readonly authRepository: UserRepositoryImpl,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async execute(
    command: RefreshTokenCommand,
  ): Promise<Result<{ access_token: string; refresh_token: string }, Error>> {
    try {
      const payload = this.jwtService.verify(command.refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });

      // Optionally, check if the refresh token is revoked or blacklisted
      const existingToken = await this.authRepository.findRefreshToken(
        command.refreshToken,
      );
      if (!existingToken || existingToken.revoked) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      // Generate new Access Token
      const newAccessToken = this.jwtService.sign(
        { email: payload.email, role: payload.role },
        {
          expiresIn: this.configService.get<string>('JWT_EXPIRES_IN'), // Access token expires in 1 minute
        },
      );

      await this.authRepository.revokeRefreshToken(command.refreshToken);

      const newRefreshToken = this.jwtService.sign(
        { email: payload.email, role: payload.rol },
        {
          expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRES_IN'), // Refresh token expires in 7 days
          secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        },
      );

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);
      await this.authRepository.saveRefreshToken(
        newRefreshToken,
        payload.email,
        expiresAt,
      );

      // Optionally, generate a new Refresh Token and invalidate the old one
      return Ok({
        access_token: newAccessToken,
        refresh_token: newRefreshToken,
      });
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }
}
