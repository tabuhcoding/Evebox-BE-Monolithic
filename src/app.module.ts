import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CqrsModule } from '@nestjs/cqrs';
import { PrismaModule } from './infrastructure/database/prisma/prisma.module';
import { EventSvcModule } from './services/event-svc/event-svc.module';
import { RagSvcModule } from './services/rag-svc/rag-svc.module';
import { AuthSvcModule } from './services/auth-svc/auth-svc.module';
import { SlackService } from './infrastructure/adapters/slack/slack.service';
import { BookingSvcModule } from './services/booking-svc/booking.module';
import { FileCacheService } from './infrastructure/cache/fileCache/fileCache.service';
import { ScheduleModule } from '@nestjs/schedule';
import { PaymentSvcModule } from './services/payment-svc/payment-svc.module';
import { FileCacheModule } from './infrastructure/cache/fileCache/fileCache.module';
import { SlackModule } from './infrastructure/adapters/slack/slack.module';
import { CronjobModule } from './services/cronjob/cronjob.module';

@Module({
  providers: [],
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // Makes ConfigService globally available
      envFilePath: '.env', // Path to .env file
    }),
    ScheduleModule.forRoot(),
    PrismaModule,
    CqrsModule,
    FileCacheModule,
    SlackModule,
    EventSvcModule,
    RagSvcModule,
    AuthSvcModule,
    BookingSvcModule,
    PaymentSvcModule,
    CronjobModule,
  ],
  exports: []
})
export class AppModule {}
