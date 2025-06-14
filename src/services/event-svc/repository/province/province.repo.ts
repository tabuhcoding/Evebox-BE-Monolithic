import { Province as PrismaProvince } from '@prisma/client';

export interface ProvinceRepository {
  getAllWithDistricts(): Promise<{ id: number; name: string; districts: { id: number; name: string }[] }[]>;
}
