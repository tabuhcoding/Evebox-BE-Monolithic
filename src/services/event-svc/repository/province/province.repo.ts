import { Province as PrismaProvince } from 'prisma/client-event';
import { ProvinceDTO } from '../../modules/location/queries/getAllDistricts/getAllDistricts-response.dto';

export interface ProvinceRepository {
  getAllWithDistricts(): Promise<ProvinceDTO[]>;
}
