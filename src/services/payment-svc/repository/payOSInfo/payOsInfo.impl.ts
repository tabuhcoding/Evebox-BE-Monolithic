import { Injectable } from "@nestjs/common";
import { PayOSInfo, PayOSInfoRepository } from "./payOsInfo.repo";
import { PrismaService } from "src/infrastructure/database/prisma/prisma.service";
import { BaseRepository } from "src/shared/repo/base.repository";
import { Prisma } from "@prisma/client";

@Injectable()
export class PayOSInfoRepositoryImpl
  extends BaseRepository<PayOSInfo, Prisma.PayOSInfoDelegate>
  implements PayOSInfoRepository {
  constructor(protected readonly prisma: PrismaService) {
    super(prisma.payOSInfo, prisma);
  }

  // Có thể thêm các phương thức riêng cho PayOSInfo nếu cần
  // Ví dụ: getPayOSInfoByUserId(userId: string): Promise<PayOSInfo | null>;
  // Hoặc: updatePayOSInfo(dto: UpdatePayOSInfoDto, userId: string): Promise<PayOSInfo>;
}