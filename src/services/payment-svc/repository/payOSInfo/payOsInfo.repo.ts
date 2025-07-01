import { BasePaymentRepository } from "../base.repository";
import { Prisma } from "prisma/client-payment";

export type PayOSInfo = Prisma.PayOSInfoGetPayload<{
}>;

export interface PayOSInfoRepository extends BasePaymentRepository<PayOSInfo, Prisma.PayOSInfoDelegate> {
  // Thêm các method riêng cho PayOSInfo nếu cần
  // Ví dụ: getPayOSInfoByUserId(userId: string): Promise<PayOSInfo | null>;
  // Hoặc: updatePayOSInfo(dto: UpdatePayOSInfoDto, userId: string): Promise<PayOSInfo>;
}