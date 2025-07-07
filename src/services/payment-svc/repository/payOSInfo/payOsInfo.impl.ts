import { Injectable } from "@nestjs/common";
import { PayOSInfo, PayOSInfoRepository } from "./payOsInfo.repo";
import { PrismaPaymentService } from "../../database/prisma-payment/prisma.service";
import { BasePaymentRepository } from "../base.repository";
import { Prisma } from "prisma/client-payment";

@Injectable()
export class PayOSInfoRepositoryImpl
  extends BasePaymentRepository<PayOSInfo, Prisma.PayOSInfoDelegate>
  implements PayOSInfoRepository {
  constructor(protected readonly prisma: PrismaPaymentService) {
    super(prisma.payOSInfo, prisma);
  }

  // Có thể thêm các phương thức riêng cho PayOSInfo nếu cần
  // Ví dụ: getPayOSInfoByUserId(userId: string): Promise<PayOSInfo | null>;
  // Hoặc: updatePayOSInfo(dto: UpdatePayOSInfoDto, userId: string): Promise<PayOSInfo>;
}