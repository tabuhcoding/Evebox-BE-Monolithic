import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/infrastructure/database/prisma/prisma.service";
import { BaseRepository } from "src/shared/repo/base.repository";
import { SeatStatus, SeatStatusRepository } from "./seatStatus.repo";
import { Prisma } from "@prisma/client";

@Injectable()
export class SeatStatusRepositoryImpl
  extends BaseRepository<SeatStatus, Prisma.SeatStatusDelegate>
  implements SeatStatusRepository
{
  constructor(protected readonly prisma: PrismaService) {
    super(prisma.seatStatus, prisma);
  }

  // Add any specific methods for SeatStatus if needed
}