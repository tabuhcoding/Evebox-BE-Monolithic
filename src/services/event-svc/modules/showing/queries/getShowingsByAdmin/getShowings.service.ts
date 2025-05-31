import { Inject, Injectable } from '@nestjs/common';
import { Err, Ok, Result } from 'oxide.ts';
import { ShowingDataDto } from './getShowings-response.dto';
import { UserRepositoryImpl } from 'src/services/auth-svc/repository/users/user.repository.impl';
import { ShowingRepository } from '../../../../repository/showing/showing.repo';

@Injectable()
export class GetShowingsByAdminService {
  constructor(
    private readonly userRepo: UserRepositoryImpl,
    @Inject('ShowingRepository') private readonly showingRepo: ShowingRepository
  ) {}

  async execute(filters: any, email: string): Promise<Result<ShowingDataDto[], Error>> {
    const isAdmin = await this.userRepo.isAdmin(email);
    if (!isAdmin) {
      return Err(new Error('Unauthorized'));
    }

    try {
      const showings = await this.showingRepo.findWithFilters(filters);
      return Ok(showings);
    } catch (error) {
      return Err(new Error('Failed to retrieve showings'));
    }
  }

  async count(filters: any): Promise<number> {
    return this.showingRepo.count(filters);
  }
}
