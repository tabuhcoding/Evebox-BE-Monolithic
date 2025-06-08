import { BaseRepository } from "src/shared/repo/base.repository";
import { Prisma } from "@prisma/client";

export type PaymentInfo = Prisma.PaymentInfoGetPayload<{

}>;

export interface PaymentInfoRepository extends BaseRepository<PaymentInfo, Prisma.PaymentInfoDelegate> {
  // Thêm các method riêng cho PaymentInfo nếu cần
  // Ví dụ: getPaymentInfoByUserId(userId: string): Promise<PaymentInfo | null>;
  // Hoặc: updatePaymentInfo(dto: UpdatePaymentInfoDto, userId: string): Promise<PaymentInfo>;
}