// backend/src/infrastructure/adapters/email/email.module.ts

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtUtils } from './jwt.util';

@Module({
  imports: [ConfigModule], 
  providers: [JwtUtils],
  exports: [JwtUtils],
})
export class JwtUtilsModule {}
