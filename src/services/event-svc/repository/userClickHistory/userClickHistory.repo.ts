import { BaseEventRepository } from '../base.repository';
import { Prisma } from "prisma/client-event";

export type UserClickHistory = Prisma.UserClickHistoryGetPayload<{
}>;

export interface UserClickHistoryRepository extends BaseEventRepository<UserClickHistory, Prisma.UserClickHistoryDelegate> {
  // Add any specific methods for UserClickHistory if needed, for example:
  // findByUserId(userId: string): Promise<UserClickHistory[]>;
  // findByEventId(eventId: string): Promise<UserClickHistory[]>;
}