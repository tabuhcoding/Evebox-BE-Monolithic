import { Inject, Injectable } from '@nestjs/common';
import { Err, Ok, Result } from 'oxide.ts';
import { ShowingDataDto } from './getShowings-response.dto';
import { UserRepositoryImpl } from 'src/services/auth-svc/repository/users/user.repository.impl';
import { ShowingRepository } from '../../../../repository/showing/showing.repo';
import { GetAdminAccessService } from 'src/services/auth-svc/modules/user/queries/get-admin-access/get-admin-access.service';
import { Pagination } from 'src/shared/constants/pagination';

@Injectable()
export class GetShowingsByAdminService {
  constructor(
    private readonly getAdminAccessService: GetAdminAccessService,
    @Inject('ShowingRepository') private readonly showingRepo: ShowingRepository
  ) { }

  async execute(filters: any, email: string): Promise<Result<[ShowingDataDto[], Pagination], Error>> {
    const isAdmin = await this.getAdminAccessService.execute(email);
    if (!isAdmin) {
      return Err(new Error('Unauthorized'));
    }

    try {
      const page = Number(filters.page) > 0 ? Number(filters.page) : 1;
      const limit = Number(filters.limit) > 0 ? Number(filters.limit) : 10;
      const showings = await this.showingRepo.findWithFilters({ ...filters, page, limit });
      const totalItems = await this.showingRepo.count(filters);
      const totalPages = Math.ceil(totalItems / limit);

      const pagination: Pagination = {
        totalItems,
        totalPages,
        page,
        limit
      };

      return Ok([showings, pagination]);
    } catch (error) {
      return Err(new Error('Failed to retrieve showings'));
    }
  }

  async count(filters: any): Promise<number> {
    return this.showingRepo.count(filters);
  }
}
