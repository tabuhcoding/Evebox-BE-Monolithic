import { Global, Module } from '@nestjs/common';
import { PrismaBookingService } from './prisma.service';

@Module({
  providers: [PrismaBookingService],
  exports: [PrismaBookingService],
})
export class PrismaBookingModule {}