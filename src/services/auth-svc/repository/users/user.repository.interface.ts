import { OTPType } from "@prisma/client";

export interface IOTPData {
  id: string;
  email: string;
  otp: string;
  type: OTPType;
  attempts: number;
  expiresAt: Date;
  isUsed: boolean;
  createdAt: Date;
  requestToken: string;
}

export interface PinStatus {
  attempts: number,
  lockedUntil: Date,
  updatedAt: Date,
  hashedPin: string,
}