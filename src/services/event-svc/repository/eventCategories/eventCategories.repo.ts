import { BaseEventRepository } from '../base.repository';
import { EventCategories } from "prisma/client-event";
import { Prisma } from "prisma/client-event";
import { Result } from "oxide.ts";
import { CategoriesResponseDto } from "../../modules/categories/queries/getAllCategories-response.dto";

export { EventCategories } from "prisma/client-event";

export interface EventCategoriesRepository
  extends BaseEventRepository<EventCategories, Prisma.EventCategoriesDelegate> {
    updateEventCategories(eventId: number, categoryIds: number[], isSpecial: boolean): Promise<void>;
    getEventCategories(eventId: number): Promise<CategoriesResponseDto[]>;
  // Thêm các method riêng cho EventCategories nếu cần, ví dụ:
  createEventCategory(eventId: number, categoryIds: number[]): Promise<Result<any, Error>>;
  updateEventCategory(eventId: number, categoryIds: number[]): Promise<Result<any, Error>>;
  getCategoriesByEventId(eventId: number): Promise<{ id: number; name: string }[]>
}