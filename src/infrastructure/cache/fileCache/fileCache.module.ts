// backend/src/infrastructure/adapters/email/email.module.ts

import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { FileCacheService } from './fileCache.service';

@Global()
@Module({
  imports: [ConfigModule], 
  providers: [FileCacheService],
  exports: [FileCacheService],
})
export class FileCacheModule {}
