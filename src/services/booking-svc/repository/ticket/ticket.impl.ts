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
  async getTicketsByTicketTypeIds(ticketTypeIds: string[]) {
  return this.prisma.ticket.findMany({
    where: {
      ticketTypeId: {
        in: ticketTypeIds.filter(id => id !== null),
      },
    },
    select: {
      ticketTypeId: true,
    },
  });
}
}