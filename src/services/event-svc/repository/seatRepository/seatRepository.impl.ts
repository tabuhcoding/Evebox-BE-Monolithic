import { Injectable } from "@nestjs/common";
import { PrismaEventService } from "../../database/prisma-event/prisma.service";
import { BaseEventRepository } from '../base.repository';
import { SeatRepository, SeatWithDetails } from "./seatRepository.repo";
import { Prisma } from "prisma/client-event";

@Injectable()
export class SeatRepositoryImpl
  extends BaseEventRepository<SeatWithDetails, Prisma.SeatDelegate>
  implements SeatRepository
{
  constructor(protected readonly prisma: PrismaEventService) {
    super(prisma.seat, prisma);
  }

  // You can implement any specific methods for SeatRepository here if needed
  // For example:
  // async findByIdWithDetails(seatId: string): Promise<SeatWithDetails | null> {
  //   return this.prisma.seat.findUnique({
  //     where: { id: seatId },
  //     include: {
  //       Row: {
  //         include: {
  //           Section: {
  //             include: {
  //               Seatmap: true,
  //             },
  //           },
  //         },
  //       },
  //     },
  //   });
  // }
}