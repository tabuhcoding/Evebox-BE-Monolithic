import { Injectable } from '@nestjs/common';
import { PrismaService } from "src/infrastructure/database/prisma/prisma.service";
import { ProvinceRepository } from './province.repo';

@Injectable()
export class ProvinceRepositoryImpl implements ProvinceRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getAllWithDistricts() {
    return this.prisma.province.findMany({
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
  }
}
