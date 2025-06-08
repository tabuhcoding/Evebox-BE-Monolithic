import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/infrastructure/database/prisma/prisma.service";
import { BaseRepository } from "src/shared/repo/base.repository";
import { Ticket, TicketRepository } from "./ticket.repo";
import { Prisma } from "@prisma/client";

@Injectable()
export class TicketRepositoryImpl
  extends BaseRepository<Ticket, Prisma.TicketDelegate>
  implements TicketRepository
{
  constructor(protected readonly prisma: PrismaService) {
    super(prisma.ticket, prisma);
  }

  countCheckedInTickets(ticketTypeIds: string[]): Promise<number> {
    return this.prisma.ticket.count({
      where: {
        ticketTypeId: { in: ticketTypeIds },
        isCheckedIn: true,
      },
    });
  }
   async countTicketsByTicketTypeIds(ticketTypeIds: string[]): Promise<Record<string, number>> {
    const grouped = await this.prisma.ticket.groupBy({
      by: ['ticketTypeId'],
      where: {
        ticketTypeId: { in: ticketTypeIds },
      },
      _count: {
        ticketTypeId: true,
      },
    });

    const result: Record<string, number> = {};
    grouped.forEach(group => {
      if (group.ticketTypeId) {
        result[group.ticketTypeId] = group._count.ticketTypeId;
      }
    });

    return result;
  }
}