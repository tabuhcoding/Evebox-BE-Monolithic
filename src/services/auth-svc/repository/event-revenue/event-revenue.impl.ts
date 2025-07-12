import { Prisma } from 'prisma/client-auth';
import { BaseAuthRepository } from '../base.repository';
import { Injectable } from "@nestjs/common";
import { EventRevenue, EventRevenueRepository } from './event-revenue.repo';
import { PrismaAuthService } from '../../database/prisma-auth/prisma.service';

@Injectable()
export class EventRevenueRepositoryImpl
  extends BaseAuthRepository<EventRevenue, Prisma.EventRevenueDelegate>
  implements EventRevenueRepository
{
  constructor(
    protected readonly prisma: PrismaAuthService,
  ) {
    super(prisma.eventRevenue, prisma);
  }
}