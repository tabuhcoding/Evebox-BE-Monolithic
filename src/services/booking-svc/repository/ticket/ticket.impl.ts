import { Injectable } from "@nestjs/common";
import { PrismaBookingService } from "../../database/prisma-booking/prisma.service";
import { BaseBookingRepository } from "../base.repository";
import { Ticket, TicketRepository } from "./ticket.repo";
import { Prisma } from "prisma/client-booking";

@Injectable()
export class TicketRepositoryImpl
  extends BaseBookingRepository<Ticket, Prisma.TicketDelegate>
  implements TicketRepository
{
  constructor(
    protected readonly prisma: PrismaBookingService,
  ) {
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

  async getCheckedInTicketsByShowingId(showingId: string) {
    return this.prisma.ticket.findMany({
      where: {
        isCheckedIn: true,
        Order: {
          showingId,
          status: 'SUCCESS',
        },
      },
      select: {
        id: true,
        orderId: true,
        ticketTypeId: true,
        Order: {
          select: {
            type: true, // PHYSICAL_TICKET or E_TICKET
          },
        },
      },
    });
  }
}