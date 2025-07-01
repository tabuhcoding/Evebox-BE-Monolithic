import { Injectable } from "@nestjs/common";
import { PaymentMethodStatus, PaymentMethodStatusRepository } from "./paymentMethodStatus.repo";
import { PrismaPaymentService } from "../../database/prisma-payment/prisma.service";
import { BasePaymentRepository } from "../base.repository";
import { Prisma } from "prisma/client-payment";

@Injectable()
export class PaymentMethodStatusRepositoryImpl
  extends BasePaymentRepository<PaymentMethodStatus, Prisma.PaymentMethodStatusDelegate>
  implements PaymentMethodStatusRepository {
  constructor(protected readonly prisma: PrismaPaymentService) {
    super(prisma.paymentMethodStatus, prisma);
  }

  // Có thể thêm các phương thức riêng cho PaymentMethodStatus nếu cần
  // Ví dụ: getPaymentMethodStatusByUserId(userId: string): Promise<PaymentMethodStatus | null>;
  // Hoặc: updatePaymentMethodStatus(dto: UpdatePaymentMethodStatusDto, userId: string): Promise<PaymentMethodStatus>;
}