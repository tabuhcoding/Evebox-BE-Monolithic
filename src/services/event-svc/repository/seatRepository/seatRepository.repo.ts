import { BaseRepository } from "src/shared/repo/base.repository";
import { Prisma, Seat } from "@prisma/client";

export type SeatWithDetails = Prisma.SeatGetPayload<{
  include: {
    Row: {
      include: {
        Section: {
          include: {
            Seatmap: true;
          };
        };
      };
    };
  };
}>;

export interface SeatRepository extends BaseRepository<SeatWithDetails, Prisma.SeatDelegate> {
  // findByIdWithDetails(seatId: string): Promise<SeatWithDetails | null>;
  // findBySectionId(sectionId: number): Promise<SeatWithDetails[]>;
  // findAvailableSeats(seatmapId: string): Promise<SeatWithDetails[]>;
}