import { Prisma } from "@prisma/client";
import { BaseRepository } from "src/shared/repo/base.repository";

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

export interface SeatmapRepository extends BaseRepository<Seatmap, Prisma.SeatmapDelegate> {
}