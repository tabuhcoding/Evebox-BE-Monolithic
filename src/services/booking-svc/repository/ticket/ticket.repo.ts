import { BaseBookingRepository } from "../base.repository";
import { Prisma } from "prisma/client-booking";
import { Result, Err } from "oxide.ts";

import { SubmitFormDto } from "../../modules/commands/submitForm/submitForm.dto";

export type Ticket = Prisma.TicketGetPayload<{
  include: {
    Order: true
  }
}>;

export interface TicketRepository extends BaseBookingRepository<Ticket, Prisma.TicketDelegate> {
  // Thêm các method riêng cho Order nếu cần
  countCheckedInTickets(ticketTypeIds: string[]): Promise<number>;
  countTicketsByTicketTypeIds(ticketTypeIds: string[]): Promise<Record<string, number>>;
}