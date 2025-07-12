import { Prisma } from 'prisma/client-auth';
import { BaseAuthRepository } from './../base.repository';
import { Injectable } from "@nestjs/common";
import { Revenue, RevenueRepository } from './revenue.repo';
import { PrismaAuthService } from '../../database/prisma-auth/prisma.service';

@Injectable()
export class RevenueRepositoryImpl
  extends BaseAuthRepository<Revenue, Prisma.RevenueDelegate>
  implements RevenueRepository 
{
  constructor(
    protected readonly prisma: PrismaAuthService,
  ) {
    super(prisma.revenue, prisma);
  }
}