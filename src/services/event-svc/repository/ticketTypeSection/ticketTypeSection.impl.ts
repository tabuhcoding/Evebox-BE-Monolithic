import { Injectable } from '@nestjs/common';
import { TicketTypeSection, TicketTypeSectionRepository } from './ticketTypeSection.repo';
import { PrismaService } from 'src/infrastructure/database/prisma/prisma.service';
import { BaseRepository } from 'src/shared/repo/base.repository';
import { Prisma } from '@prisma/client';

@Injectable()
export class TicketTypeSectionRepositoryImpl
  extends BaseRepository<TicketTypeSection, Prisma.TicketTypeSectionDelegate>
  implements TicketTypeSectionRepository
{
  constructor(protected readonly prisma: PrismaService) {
    super(prisma.ticketTypeSection, prisma);
  }

  // You can add any specific methods for TicketTypeSection if needed here
  // For example:
  // async findByTicketTypeId(ticketTypeId: string): Promise<TicketTypeSection[]> {
  //   return this.prisma.ticketTypeSection.findMany({
  //     where: { ticketTypeId },
  //   });
  // }
}