import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/infrastructure/database/prisma/prisma.service";
import { BaseRepository } from "src/shared/repo/base.repository";
import { SeatRepository, SeatWithDetails } from "./seatRepository.repo";
import { Prisma } from "@prisma/client";

@Injectable()
export class SeatRepositoryImpl
  extends BaseRepository<SeatWithDetails, Prisma.SeatDelegate>
  implements SeatRepository
{
  constructor(protected readonly prisma: PrismaService) {
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