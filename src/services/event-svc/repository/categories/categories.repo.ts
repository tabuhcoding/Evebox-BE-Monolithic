import { BaseEventRepository } from '../base.repository';
import { Categories } from "prisma/client-event";
import { Prisma } from "prisma/client-event";

export { Categories }

export interface CategoriesRepository
  extends BaseEventRepository<Categories, Prisma.CategoriesDelegate> {
  // Thêm các method riêng cho Categories nếu cần, ví dụ:
}