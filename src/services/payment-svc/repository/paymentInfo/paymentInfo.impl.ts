import { Injectable } from "@nestjs/common";
import { PaymentInfo, PaymentInfoRepository } from "./paymentInfo.repo";
import { PrismaService } from "src/infrastructure/database/prisma/prisma.service";
import { BaseRepository } from "src/shared/repo/base.repository";
import { Prisma } from "@prisma/client";

@Injectable()
export class PaymentInfoRepositoryImpl
  extends BaseRepository<PaymentInfo, Prisma.PaymentInfoDelegate>
  implements PaymentInfoRepository {
  constructor(protected readonly prisma: PrismaService) {
    super(prisma.paymentInfo, prisma);
  }

  // Có thể thêm các phương thức riêng cho PaymentInfo nếu cần
  // Ví dụ: getPaymentInfoByUserId(userId: string): Promise<PaymentInfo | null>;
  // Hoặc: updatePaymentInfo(dto: UpdatePaymentInfoDto, userId: string): Promise<PaymentInfo>;
}