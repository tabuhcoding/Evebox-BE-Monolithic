import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CqrsModule } from '@nestjs/cqrs';
import { PrismaModule } from './infrastructure/database/prisma/prisma.module';
import { EventSvcModule } from './services/event-svc/event-svc.module';
import { RagSvcModule } from './services/rag-svc/rag-svc.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // Makes ConfigService globally available
      envFilePath: '.env', // Path to .env file
    }),
    PrismaModule,
    CqrsModule,
    EventSvcModule,
    RagSvcModule,
  ],
})
export class AppModule {}
