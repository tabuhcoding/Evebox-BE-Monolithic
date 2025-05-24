import { BaseRepository } from "src/shared/repo/base.repository";
import { Prisma } from "@prisma/client";

export type UserClickHistory = Prisma.UserClickHistoryGetPayload<{
}>;

export interface UserClickHistoryRepository extends BaseRepository<UserClickHistory, Prisma.UserClickHistoryDelegate> {
  // Add any specific methods for UserClickHistory if needed, for example:
  // findByUserId(userId: string): Promise<UserClickHistory[]>;
  // findByEventId(eventId: string): Promise<UserClickHistory[]>;
}