import { Prisma } from 'prisma/client-auth';
import { BaseAuthRepository } from '../base.repository';
import { Injectable } from "@nestjs/common";
import { PrismaAuthService } from '../../database/prisma-auth/prisma.service';
import { AdminManageEvent, AdminManageEventRepository } from './admin-area.repo';

@Injectable()
export class AdminManageEventRepositoryImpl
  extends BaseAuthRepository<AdminManageEvent, Prisma.AdminManageEventDelegate>
  implements AdminManageEventRepository
{
  constructor(
    protected readonly prisma: PrismaAuthService,
  ) {
    super(prisma.adminManageEvent, prisma);
  }
}