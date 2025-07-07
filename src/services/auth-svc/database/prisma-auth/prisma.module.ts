import { Global, Module } from '@nestjs/common';
import { PrismaAuthService } from './prisma.service';

@Module({
  providers: [PrismaAuthService],
  exports: [PrismaAuthService],
})
export class PrismaAuthModule {}