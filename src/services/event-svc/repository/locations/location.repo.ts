import { BaseRepository } from "src/shared/repo/base.repository";
import { locations } from "@prisma/client";
import { Prisma } from "@prisma/client";

export { locations }

export interface LocationsRepository
  extends BaseRepository<locations, Prisma.locationsDelegate> {
  // Thêm các method riêng cho locations nếu cần, ví dụ:
  createLocation(streetString: string, wardString: string, districtId: number): Promise<number>
}