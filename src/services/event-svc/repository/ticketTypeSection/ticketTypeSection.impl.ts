import { Injectable } from '@nestjs/common';
import { TicketTypeSection, TicketTypeSectionRepository } from './ticketTypeSection.repo';
import { PrismaEventService } from '../../database/prisma-event/prisma.service';
import { BaseEventRepository } from '../base.repository';
import { Prisma } from 'prisma/client-event';

@Injectable()
export class TicketTypeSectionRepositoryImpl
  extends BaseEventRepository<TicketTypeSection, Prisma.TicketTypeSectionDelegate>
  implements TicketTypeSectionRepository
{
  constructor(protected readonly prisma: PrismaEventService) {
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