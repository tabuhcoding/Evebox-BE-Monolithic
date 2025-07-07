import { Injectable } from "@nestjs/common";
import { PrismaEventService } from "../../database/prisma-event/prisma.service";
import { BaseEventRepository } from '../base.repository';
import { Seatmap, SeatmapRepository } from "./seatmap.repo";
import { Prisma } from "prisma/client-event";

@Injectable()
export class SeatmapRepositoryImpl
  extends BaseEventRepository<Seatmap, Prisma.SeatmapDelegate>
  implements SeatmapRepository
{
  constructor(protected readonly prisma: PrismaEventService) {
    super(prisma.seatmap, prisma);
  }

  async getSeatMapById(seatMapId: number): Promise<any> {
    return this.prisma.seatmap.findFirst({
      where: { id: seatMapId },
      select: {
        id: true,
        Section: {
          select: {
            id: true,
            Row: {
              select: {
                Seat: {
                  select: { SeatStatus: true }
                }
              }
            }
          }
        }
      }
    });
  }
}