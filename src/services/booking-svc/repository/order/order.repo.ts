import { BaseRepository } from "src/shared/repo/base.repository";
import { Prisma } from "@prisma/client";

export type Order = Prisma.OrderGetPayload<{
  include: {
    Ticket: true;
  }
}>;

export interface OrderRepository extends BaseRepository<Order, Prisma.OrderDelegate> {
  // Thêm các method riêng cho Order nếu cần
}