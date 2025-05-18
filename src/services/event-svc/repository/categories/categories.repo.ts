import { BaseRepository } from "src/shared/repo/base.repository";
import { Categories } from "@prisma/client";
import { Prisma } from "@prisma/client";

export { Categories }

export interface CategoriesRepository
  extends BaseRepository<Categories, Prisma.CategoriesDelegate> {
  // Thêm các method riêng cho Categories nếu cần, ví dụ:
}