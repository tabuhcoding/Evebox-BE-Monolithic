import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/infrastructure/database/prisma/prisma.service";
import { BaseRepository } from "src/shared/repo/base.repository";
import { locations, Prisma } from "@prisma/client";
import { LocationsRepository } from "./location.repo";
import { OrganizerLocationDto } from "../../modules/location/queries/getAllLocations/getAllLocation-response.dto";

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

  async getAllLocations(organizerId?: string, provinceId?: number): Promise<OrganizerLocationDto[]> {
    const events = await this.prisma.events.findMany({
      where: {
        ...(organizerId ? { organizerId } : {}),
        ...(provinceId ? {
          locations: {
            districts: {
              provinceId,
            },
          },
        } : {}),
      },
      include: {
        locations: {
          include: {
            districts: {
              include: {
                province: true,
              },
            },
          },
        },
      },
    });

    const grouped = new Map<string, OrganizerLocationDto>();

    for (const event of events) {
      const loc = event.locations;
      if (!loc || !loc.districts || !loc.districts.province) continue;

      const key = event.organizerId!;
      if (!grouped.has(key)) {
        grouped.set(key, {
          id: event.id,
          organizerId: key,
          venues: [],
        });
      }

      grouped.get(key)!.venues.push({
        street: loc.street,
        ward: loc.ward,
        district: loc.districts.name,
        province: loc.districts.province.name,
        event: {
          title: event.title,
          venue: event.venue,
          orgName: event.orgName,
        },
      });
    }

    return Array.from(grouped.values());
  }

  async getLocationWithDistrictAndProvince(id: number) {
    return this.prisma.locations.findUnique({
      where: { id },
      select: {
        id: true,
        street: true,
        ward: true,
        districts: {
          select: {
            name: true,
            province: {
              select: { name: true },
            },
          },
        },
      },
    });
  }
}