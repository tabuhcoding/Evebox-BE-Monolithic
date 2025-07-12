import { Prisma } from 'prisma/client-auth';
import { BaseAuthRepository } from '../base.repository';
import { Injectable } from "@nestjs/common";
import { TicketTypeRevenue, TicketTypeRevenueRepository } from './tickettype-revenue.repo';
import { PrismaAuthService } from '../../database/prisma-auth/prisma.service';

@Injectable()
export class TicketTypeRevenueRepositoryImpl
  extends BaseAuthRepository<TicketTypeRevenue, Prisma.TicketTypeRevenueDelegate>
  implements TicketTypeRevenueRepository
{
  constructor(
    protected readonly prisma: PrismaAuthService,
  ) {
    super(prisma.ticketTypeRevenue, prisma);
  }
}