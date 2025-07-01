import { BaseEventRepository } from '../base.repository';
import { Prisma, Seat } from "prisma/client-event";

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

export interface SeatRepository extends BaseEventRepository<SeatWithDetails, Prisma.SeatDelegate> {
  // findByIdWithDetails(seatId: string): Promise<SeatWithDetails | null>;
  // findBySectionId(sectionId: number): Promise<SeatWithDetails[]>;
  // findAvailableSeats(seatmapId: string): Promise<SeatWithDetails[]>;
}