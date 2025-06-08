import { BaseRepository } from "src/shared/repo/base.repository";
import { Prisma } from "@prisma/client";

export type PaymentMethodStatus = Prisma.PaymentMethodStatusGetPayload<{
}>;

export { PaymentMethod } from '@prisma/client';

export interface PaymentMethodStatusRepository extends BaseRepository<PaymentMethodStatus, Prisma.PaymentMethodStatusDelegate> {
  // Thêm các method riêng cho PaymentMethodStatus nếu cần
}