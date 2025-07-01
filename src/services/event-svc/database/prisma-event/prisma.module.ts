import { Global, Module } from '@nestjs/common';
import { PrismaEventService } from './prisma.service';

@Module({
  providers: [PrismaEventService],
  exports: [PrismaEventService],
})
export class PrismaEventModule {}