import { Global, Module } from '@nestjs/common';
import { PrismaPaymentService } from './prisma.service';

@Module({
  providers: [PrismaPaymentService],
  exports: [PrismaPaymentService],
})
export class PrismaPaymentModule {}