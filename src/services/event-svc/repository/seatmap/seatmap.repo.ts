import { Prisma } from "prisma/client-event";
import { BaseEventRepository } from '../base.repository';

export type Seatmap = Prisma.SeatmapGetPayload<{
  include: {
    Section: {
      include: {
        Row: {
          include: {
            Seat: {
              include: {
                SeatStatus: true;
              }
            };
          };
        }
      }
    }
  }
}>;

export interface SeatmapRepository extends BaseEventRepository<Seatmap, Prisma.SeatmapDelegate> {
  getSeatMapById(seatMapId: number): Promise<any>;
}