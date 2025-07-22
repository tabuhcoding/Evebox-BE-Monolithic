import { Prisma } from "prisma/client-auth";
import { BaseAuthRepository } from "../base.repository";
import { Injectable } from "@nestjs/common";
import { PrismaAuthService } from '../../database/prisma-auth/prisma.service';
import { AIAnalyst, AIAnalystRepository } from './ai-analyst.repo';

@Injectable()
export class AIAnalystRepositoryImpl
  extends BaseAuthRepository<AIAnalyst, Prisma.AIAnalystDelegate>
  implements AIAnalystRepository
{
  constructor(
    protected readonly prisma: PrismaAuthService,
  ) {
    super(prisma.aIAnalyst, prisma);
  }

  // Additional methods specific to AIAnalystRepository can be implemented here if needed
}