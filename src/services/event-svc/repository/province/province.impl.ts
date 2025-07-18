import { Injectable } from '@nestjs/common';
import { PrismaEventService } from '../../database/prisma-event/prisma.service';
import { ProvinceRepository } from './province.repo';

@Injectable()
export class ProvinceRepositoryImpl implements ProvinceRepository {
  constructor(private readonly prisma: PrismaEventService) {}

  async getAllWithDistricts() {
    const province = await this.prisma.province.findMany({
      select: {
        id: true,
        name: true,
        en_name: true,
        districts: {
          select: {
            id: true,
            name: true,
            en_name: true,
          }
        }
      }
    });

    const result = province.map((item) => ({
      id: item.id,
      name: {
        en: item.en_name,
        vi: item.name
      },
      districts: item.districts.map((district) => ({
        id: district.id,
        name: {
          en: district.en_name,
          vi: district.name
        }
      }))
    }));

    return result;
  }
}
