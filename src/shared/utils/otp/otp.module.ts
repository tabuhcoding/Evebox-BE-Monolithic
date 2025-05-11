// backend/src/infrastructure/adapters/email/email.module.ts

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { OtpUtils } from './otp.util';

@Module({
  imports: [ConfigModule], 
  providers: [OtpUtils],
  exports: [OtpUtils],
})
export class OtpUtilsModule {}
