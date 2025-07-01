import { Injectable } from "@nestjs/common";
import { PrismaEventService } from "../../database/prisma-event/prisma.service";
import { BaseEventRepository } from '../base.repository';
import { SeatStatus, SeatStatusRepository } from "./seatStatus.repo";
import { Prisma } from "prisma/client-event";

@Injectable()
export class SeatStatusRepositoryImpl
  extends BaseEventRepository<SeatStatus, Prisma.SeatStatusDelegate>
  implements SeatStatusRepository
{
  constructor(protected readonly prisma: PrismaEventService) {
    super(prisma.seatStatus, prisma);
  }

  // Add any specific methods for SeatStatus if needed
}