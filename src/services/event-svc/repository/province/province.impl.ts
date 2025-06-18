import { Injectable } from '@nestjs/common';
import { PrismaService } from "src/infrastructure/database/prisma/prisma.service";
import { ProvinceRepository } from './province.repo';

@Injectable()
export class ProvinceRepositoryImpl implements ProvinceRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getAllWithDistricts() {
    const province = await this.prisma.province.findMany({
      select: {
        id: true,
        name: true,
        districts: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    const result = province.map((item) => ({
      id: item.id,
      name: {
        en: "EN will be able later",
        vi: item.name
      },
      districts: item.districts.map((district) => ({
        id: district.id,
        name: {
          en: "EN will be able later",
          vi: district.name
        }
      }))
    }));

    return result;
  }
}
