import { Prisma } from 'prisma/client-auth';
import { BaseAuthRepository } from '../base.repository';
import { Injectable } from "@nestjs/common";
import { ShowingRevenue, ShowingRevenueRepository } from './showing-revenue.repo';
import { PrismaAuthService } from '../../database/prisma-auth/prisma.service';

@Injectable()
export class ShowingRevenueRepositoryImpl
  extends BaseAuthRepository<ShowingRevenue, Prisma.ShowingRevenueDelegate>
  implements ShowingRevenueRepository
{
  constructor(
    protected readonly prisma: PrismaAuthService,
  ) {
    super(prisma.showingRevenue, prisma);
  }
}