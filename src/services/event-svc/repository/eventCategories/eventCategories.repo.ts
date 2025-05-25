import { BaseRepository } from "src/shared/repo/base.repository";
import { EventCategories } from "@prisma/client";
import { Prisma } from "@prisma/client";
import { CategoriesResponseDto } from "../../modules/categories/queries/getAllCategories-response.dto";

export { EventCategories } from "@prisma/client";

export interface EventCategoriesRepository
  extends BaseRepository<EventCategories, Prisma.EventCategoriesDelegate> {
    updateEventCategories(eventId: number, categoryIds: number[], isSpecial: boolean): Promise<void>;
    getEventCategories(eventId: number): Promise<CategoriesResponseDto[]>;
  // Thêm các method riêng cho EventCategories nếu cần, ví dụ:
}