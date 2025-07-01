import { BaseBookingRepository } from "../base.repository";
import { Prisma } from "prisma/client-booking";

import { OrderData } from "../../modules/queries/getOrdersByShowingId/getOrdersByShowingId-response.dto";
import { Result } from "oxide.ts";
import { Pagination, PaginationQuery } from "src/shared/constants/pagination";

export type Order = Prisma.OrderGetPayload<{
  include: {
    Ticket: true;
  }
}>;

export { BookingTicketStatus, BookingTicketType } from "prisma/client-booking"

export interface OrderRepository extends BaseBookingRepository<Order, Prisma.OrderDelegate> {
  // Thêm các method riêng cho Order nếu cần
  getOrders(showingId: string, paginationQuery: PaginationQuery): Promise<Result<[OrderData[], Pagination], Error>>;
}