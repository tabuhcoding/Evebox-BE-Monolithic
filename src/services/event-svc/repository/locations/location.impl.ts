import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/infrastructure/database/prisma/prisma.service";
import { BaseRepository } from "src/shared/repo/base.repository";
import { locations, Prisma } from "@prisma/client";
import { LocationsRepository } from "./location.repo";

@Injectable()
export class LocationsRepositoryImpl
  extends BaseRepository<locations, Prisma.locationsDelegate>
  implements LocationsRepository {
  constructor(protected readonly prisma: PrismaService) {
    super(prisma.locations, prisma);
  }

  async createLocation(streetString: string, wardString: string, districtId: number): Promise<number> {
    try {
      const whereCond = {
        street: streetString,
        ward: wardString,
        districtId: districtId >> 0,
      }
      const location = await this.repo.findFirst({
        where: whereCond
      });

      if (location) {
        return location.id;
      }
      const result = await this.prisma.locations.create({
        data: {
          street: streetString,
          ward: wardString,
          districtId: districtId >> 0,
        },
      });

      if (!result) {
        throw new Error('Failed to create location');
      }

      return result.id;
    } catch (error) {
      throw new Error(`Failed to create location: ${error.message}`);
    }
  }
}