import { Inject, Injectable } from '@nestjs/common';
import { Result, Ok, Err } from 'oxide.ts';
import { FavoriteRepository } from 'src/services/auth-svc/repository/favorite/favorite.repo';
import { UserRepositoryImpl } from 'src/services/auth-svc/repository/users/user.repository.impl';

@Injectable()
export class GetUsersNotifiedByOrgService {
  constructor(
      @Inject('FavoriteRepository') private readonly favoriteRepository: FavoriteRepository,
      private readonly userRepository: UserRepositoryImpl
  ) {}

  async execute(orgId: string): Promise<Result<{ email: string }[], Error>> {
    try {
      const userIds = await this.favoriteRepository.getUserIdsNotifiedByOrganizer(orgId);
      const emails = await this.userRepository.getEmailsByIds(userIds.map(u => u.userId));
      return Ok(emails.map(email => ({ email })));
    } catch (error) {
      return Err(new Error('Failed to fetch notified user emails for organizer'));
    }
  }
}
