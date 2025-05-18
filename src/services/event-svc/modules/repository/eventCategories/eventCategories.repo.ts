import { BaseRepository } from "src/shared/repo/base.repository";
import { EventCategories } from "@prisma/client";
import { Prisma } from "@prisma/client";

export { EventCategories } from "@prisma/client";

export interface EventCategoriesRepository
  extends BaseRepository<EventCategories, Prisma.EventCategoriesDelegate> {
  // Thêm các method riêng cho EventCategories nếu cần, ví dụ:
}