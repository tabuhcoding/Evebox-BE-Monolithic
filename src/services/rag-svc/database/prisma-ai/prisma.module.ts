import { Global, Module } from '@nestjs/common';
import { PrismaAIService } from './prisma.service';

@Global()
@Module({
  providers: [PrismaAIService],
  exports: [PrismaAIService],
})
export class PrismaAIModule {}