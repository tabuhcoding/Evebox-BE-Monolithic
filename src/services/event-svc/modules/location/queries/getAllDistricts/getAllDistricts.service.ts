import { Inject, Injectable } from '@nestjs/common';
import { Result, Ok, Err } from 'oxide.ts';
import { Province } from './getAllDistricts-response.dto';
import { ProvinceRepository } from 'src/services/event-svc/repository/province/province.repo';

@Injectable()
export class GetAllDistrictsService {
  constructor(
    @Inject('ProvinceRepository') private readonly provinceRepo: ProvinceRepository
  ) {}

  async getAllDistricts(): Promise<Result<Province[], Error>> {
    try {
      const provinces = await this.provinceRepo.getAllWithDistricts();
      return Ok(provinces);
    } catch (error) {
      return Err(new Error('Failed to retrieve districts'));
    }
  }
}
