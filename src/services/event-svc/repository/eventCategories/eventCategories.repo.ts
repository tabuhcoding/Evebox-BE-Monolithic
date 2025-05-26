import { BaseRepository } from "src/shared/repo/base.repository";
import { EventCategories } from "@prisma/client";
import { Prisma } from "@prisma/client";
import { Result } from "oxide.ts";

export { EventCategories } from "@prisma/client";

export interface EventCategoriesRepository
  extends BaseRepository<EventCategories, Prisma.EventCategoriesDelegate> {
  // Thêm các method riêng cho EventCategories nếu cần, ví dụ:
  createEventCategory(eventId: number, categoryIds: number[]): Promise<Result<any, Error>>;
  updateEventCategory(eventId: number, categoryIds: number[]): Promise<Result<any, Error>>;
}