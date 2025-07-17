// src/modules/auth/repositories/auth.repository.ts
import { isEmail } from 'class-validator';
import { User } from '../../modules/user/domain/entities/user.entity';
import { Email } from '../../modules/user/domain/value-objects/user/email.vo';
import { UserId } from '../../modules/user/domain/value-objects/user/user-id.vo';
import { Prisma, RefreshToken } from 'prisma/client-auth';
import { OTP } from '../../modules/user/domain/entities/otp.entity';
import { OTPType } from '../../modules/user/domain/enums/otp-type.enum';
import { IOTPData } from './user.repository.interface';
import { BaseAuthRepository } from '../base.repository';
import { PinStatus } from './user.repository.interface';
import { Pagination, PaginationQuery } from 'src/shared/constants/pagination';

export interface UserRepository extends BaseAuthRepository<User, Prisma.UserDelegate> {
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
  isEmailExists(email: string): Promise<boolean>;
  setReceiveNoti(userId: string, recseive: boolean): Promise<void>;
  getReceiveNotiByUserId(userId: string): Promise<boolean>;
  getEmailsByIds(userIds: string[]): Promise<string[]>;
  isAdmin(email: string): Promise<boolean>;
  findPinStatusByEmail(email: Email): Promise<PinStatus | null>;
  createPinUser(email: Email, pin: string): Promise<void>;
  updatePinUser(email: Email, pin: string): Promise<void>;
  findUserByEmail(email: string): Promise<User | null>
  findAllAdminEmails(): Promise<string[]>;
  updateUserRoleToOrganizer(email: string): Promise<boolean>;
  countWithSearch(search: string): Promise<number>;
  getUsersWithSearch(search: string, pagination: PaginationQuery): Promise<string[]>;
  increaseTotalEvents(email: string): Promise<void>;
}
