import { BaseRepository } from "src/shared/repo/base.repository";
import { Prisma } from "@prisma/client";

import { OrderData } from "../../modules/queries/getOrdersByShowingId/getOrdersByShowingId-response.dto";
import { Result } from "oxide.ts";

export type Order = Prisma.OrderGetPayload<{
  include: {
    Ticket: true;
  }
}>;

export { BookingTicketStatus, BookingTicketType } from "@prisma/client"

export interface OrderRepository extends BaseRepository<Order, Prisma.OrderDelegate> {
  // Thêm các method riêng cho Order nếu cần
  getOrders(showingId: string): Promise<Result<OrderData[], Error>>;
}