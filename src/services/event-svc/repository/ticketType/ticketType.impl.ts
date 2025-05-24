import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/infrastructure/database/prisma/prisma.service";
import { BaseRepository } from "src/shared/repo/base.repository";
import { TicketType, TicketTypeRepository } from "./ticketType.repo";
import { Prisma } from "@prisma/client";

@Injectable()
export class TicketTypeRepositoryImpl
  extends BaseRepository<TicketType, Prisma.TicketTypeDelegate>
  implements TicketTypeRepository
{
  constructor(protected readonly prisma: PrismaService) {
    super(prisma.ticketType, prisma);
  }
}