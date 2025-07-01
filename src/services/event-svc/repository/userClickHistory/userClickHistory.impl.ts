import { Injectable } from "@nestjs/common";
import { UserClickHistory, UserClickHistoryRepository } from "./userClickHistory.repo";
import { PrismaEventService } from "../../database/prisma-event/prisma.service";
import { BaseEventRepository } from '../base.repository';
import { Prisma } from "prisma/client-event";

@Injectable()
export class UserClickHistoryRepositoryImpl
  extends BaseEventRepository<UserClickHistory, Prisma.UserClickHistoryDelegate>
  implements UserClickHistoryRepository
{
  constructor(protected readonly prisma: PrismaEventService) {
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