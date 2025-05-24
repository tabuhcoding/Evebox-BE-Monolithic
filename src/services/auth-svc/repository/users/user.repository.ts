// src/modules/auth/repositories/auth.repository.ts
import { User } from '../../modules/user/domain/entities/user.entity';
import { Email } from '../../modules/user/domain/value-objects/user/email.vo';
import { UserId } from '../../modules/user/domain/value-objects/user/user-id.vo';
import { RefreshToken } from '@prisma/client';
import { OTP } from '../../modules/user/domain/entities/otp.entity';
import { OTPType } from '../../modules/user/domain/enums/otp-type.enum';
import { IOTPData } from './user.repository.interface';

export interface UserRepository {
  findByEmail(email: Email): Promise<User | null>;
  save(user: User): Promise<void>;
  updateUserInfo(user: User): Promise<void>;
  findById(id: UserId): Promise<User | null>;
  save(user: User): Promise<void>;
  saveRefreshToken(token: string, email: string, expiresAt: Date): Promise<void>;
  revokeRefreshToken(email: string): Promise<void>;
  revokeAllRefreshTokens(email: string): Promise<void>;
  findRefreshToken(token: string): Promise<RefreshToken | null>;
  saveOTP(otp: OTP, requestToken: string): Promise<void>;
  findValidOTP(email: string, otp: string, type: OTPType, requestToken: string): Promise<IOTPData | null>
  incrementOTPAttempts(request_token: string): Promise<void>
  getOTPAttempts(request_token: string): Promise<number | null>
  markOTPAsUsed(requestToken: string): Promise<void>
  removeAllRefreshTokens(email: string): Promise<void>
  setReceiveNoti(userId: string, receive: boolean): Promise<void>;
  getReceiveNotiByUserId(userId: string): Promise<boolean>;
  getEmailsByIds(userIds: string[]): Promise<string[]>;
}
