import { Injectable } from "@nestjs/common";
import { PaymentMethodStatus, PaymentMethodStatusRepository } from "./paymentMethodStatus.repo";
import { PrismaService } from "src/infrastructure/database/prisma/prisma.service";
import { BaseRepository } from "src/shared/repo/base.repository";
import { Prisma } from "@prisma/client";

@Injectable()
export class PaymentMethodStatusRepositoryImpl
  extends BaseRepository<PaymentMethodStatus, Prisma.PaymentMethodStatusDelegate>
  implements PaymentMethodStatusRepository {
  constructor(protected readonly prisma: PrismaService) {
    super(prisma.paymentMethodStatus, prisma);
  }

  // Có thể thêm các phương thức riêng cho PaymentMethodStatus nếu cần
  // Ví dụ: getPaymentMethodStatusByUserId(userId: string): Promise<PaymentMethodStatus | null>;
  // Hoặc: updatePaymentMethodStatus(dto: UpdatePaymentMethodStatusDto, userId: string): Promise<PaymentMethodStatus>;
}