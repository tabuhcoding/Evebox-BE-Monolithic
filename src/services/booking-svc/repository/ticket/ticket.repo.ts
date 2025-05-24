import { BaseRepository } from "src/shared/repo/base.repository";
import { Prisma } from "@prisma/client";

export type Ticket = Prisma.TicketGetPayload<{
  include: {
    Order: true
  }
}>;

export interface TicketRepository extends BaseRepository<Ticket, Prisma.TicketDelegate> {
  // Thêm các method riêng cho Order nếu cần
}