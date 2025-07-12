import { OrganizeRevenue, Prisma } from 'prisma/client-auth';
import { BaseAuthRepository } from './../base.repository';
import { Injectable } from "@nestjs/common";
import { OrganizerRevenue, OrganizerRevenueRepository } from './organizer-revenue.repo';
import { PrismaAuthService } from '../../database/prisma-auth/prisma.service';

@Injectable()
export class OrganizerRevenueRepositoryImpl
  extends BaseAuthRepository<OrganizerRevenue, Prisma.OrganizeRevenueDelegate>
  implements OrganizerRevenueRepository
{
  constructor(
    protected readonly prisma: PrismaAuthService,
  ) {
    super(prisma.organizeRevenue, prisma);
  }
}