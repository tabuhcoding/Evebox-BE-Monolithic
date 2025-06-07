import { BaseRepository } from "src/shared/repo/base.repository";
import { locations } from "@prisma/client";
import { Prisma } from "@prisma/client";
import { OrganizerLocationDto } from "../../modules/location/queries/getAllLocations/getAllLocation-response.dto";

export { locations }

export interface LocationsRepository
  extends BaseRepository<locations, Prisma.locationsDelegate> {
  // Thêm các method riêng cho locations nếu cần, ví dụ:
  createLocation(streetString: string, wardString: string, districtId: number): Promise<number>
  getAllLocations(
    organizerId?: string,
    provinceId?: number
  ): Promise<OrganizerLocationDto[]>;

  getLocationWithDistrictAndProvince(id: number): Promise<{
    id: number;
    street: string;
    ward: string;
    districts: {
      name: string;
      province: {
        name: string;
      };
    };
  } | null>;
}