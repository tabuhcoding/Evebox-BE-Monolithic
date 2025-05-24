import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/infrastructure/database/prisma/prisma.service";
import { BaseRepository } from "src/shared/repo/base.repository";
import { Seatmap, SeatmapRepository } from "./seatmap.repo";
import { Prisma } from "@prisma/client";

@Injectable()
export class SeatmapRepositoryImpl
  extends BaseRepository<Seatmap, Prisma.SeatmapDelegate>
  implements SeatmapRepository
{
  constructor(protected readonly prisma: PrismaService) {
    super(prisma.seatmap, prisma);
  }
}