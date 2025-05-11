// backend/src/infrastructure/adapters/email/email.module.ts

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TempUserStore } from './local-storage.service';

@Module({
  imports: [ConfigModule], 
  providers: [TempUserStore],
  exports: [TempUserStore],
})
export class LocalStorageModule {}
