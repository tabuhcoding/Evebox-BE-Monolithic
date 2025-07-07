import { BasePaymentRepository } from '../base.repository';
import { Prisma } from "prisma/client-payment";

export type PaymentMethodStatus = Prisma.PaymentMethodStatusGetPayload<{
}>;

export { PaymentMethod } from 'prisma/client-payment';

export interface PaymentMethodStatusRepository extends BasePaymentRepository<PaymentMethodStatus, Prisma.PaymentMethodStatusDelegate> {
  // Thêm các method riêng cho PaymentMethodStatus nếu cần
}