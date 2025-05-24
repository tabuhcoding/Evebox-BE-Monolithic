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

  // Thêm các phương thức riêng cho Ticket nếu cần
}