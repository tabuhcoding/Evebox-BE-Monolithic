import { BasePaymentRepository } from "../base.repository";
import { Prisma } from "prisma/client-payment";

export type PaymentInfo = Prisma.PaymentInfoGetPayload<{

}>;

export interface PaymentInfoRepository extends BasePaymentRepository<PaymentInfo, Prisma.PaymentInfoDelegate> {
  // Thêm các method riêng cho PaymentInfo nếu cần
  // Ví dụ: getPaymentInfoByUserId(userId: string): Promise<PaymentInfo | null>;
  // Hoặc: updatePaymentInfo(dto: UpdatePaymentInfoDto, userId: string): Promise<PaymentInfo>;
}