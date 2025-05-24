import { BaseRepository } from "src/shared/repo/base.repository";
import { Prisma, SeatStatusEnum } from "@prisma/client";
import { from } from "rxjs";

export type SeatStatus = Prisma.SeatStatusGetPayload<{
  include: {
    Seat: true;
    Showing: true;
  };
}>;

export { SeatStatusEnum } from "@prisma/client";

export interface SeatStatusRepository extends BaseRepository<SeatStatus, Prisma.SeatStatusDelegate> {
  
}