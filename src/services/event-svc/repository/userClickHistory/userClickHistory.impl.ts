import { Injectable } from "@nestjs/common";
import { UserClickHistory, UserClickHistoryRepository } from "./userClickHistory.repo";
import { PrismaService } from "src/infrastructure/database/prisma/prisma.service";
import { BaseRepository } from "src/shared/repo/base.repository";
import { Prisma } from "@prisma/client";

@Injectable()
export class UserClickHistoryRepositoryImpl
  extends BaseRepository<UserClickHistory, Prisma.UserClickHistoryDelegate>
  implements UserClickHistoryRepository
{
  constructor(protected readonly prisma: PrismaService) {
    super(prisma.userClickHistory, prisma);
  }

  // You can add any specific methods for UserClickHistory if needed here
  // For example:
  // async findByUserId(userId: string): Promise<UserClickHistory[]> {
  //   return this.prisma.userClickHistory.findMany({
  //     where: { userId },
  //   });
  // }
}