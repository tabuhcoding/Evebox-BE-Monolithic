import { Injectable } from "@nestjs/common";
import { PaymentInfo, PaymentInfoRepository } from "./paymentInfo.repo";
import { PrismaPaymentService } from "../../database/prisma-payment/prisma.service";
import { BasePaymentRepository } from "../base.repository";
import { Prisma } from "prisma/client-payment";

@Injectable()
export class PaymentInfoRepositoryImpl
  extends BasePaymentRepository<PaymentInfo, Prisma.PaymentInfoDelegate>
  implements PaymentInfoRepository {
  constructor(protected readonly prisma: PrismaPaymentService) {
    super(prisma.paymentInfo, prisma);
  }

  // Có thể thêm các phương thức riêng cho PaymentInfo nếu cần
  // Ví dụ: getPaymentInfoByUserId(userId: string): Promise<PaymentInfo | null>;
  // Hoặc: updatePaymentInfo(dto: UpdatePaymentInfoDto, userId: string): Promise<PaymentInfo>;
}