import { BaseEventRepository } from '../base.repository';
import { Prisma, SeatStatusEnum } from "prisma/client-event";

export type SeatStatus = Prisma.SeatStatusGetPayload<{
  include: {
    Seat: true;
    Showing: true;
  };
}>;

export { SeatStatusEnum } from "prisma/client-event";

export interface SeatStatusRepository extends BaseEventRepository<SeatStatus, Prisma.SeatStatusDelegate> {
  
}