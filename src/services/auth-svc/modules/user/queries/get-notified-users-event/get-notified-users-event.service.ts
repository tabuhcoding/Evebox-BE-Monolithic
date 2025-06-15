import { Inject, Injectable } from '@nestjs/common';
import { Result, Ok, Err } from 'oxide.ts';
import { FavoriteRepository } from 'src/services/auth-svc/repository/favorite/favorite.repo';
import { UserRepositoryImpl } from 'src/services/auth-svc/repository/users/user.repository.impl';
import { SlackService } from "src/infrastructure/adapters/slack/slack.service";
import { Pagination, PaginationQuery } from 'src/shared/constants/pagination';

@Injectable()
export class GetUsersNotifiedByEventService {
  constructor(
    @Inject('FavoriteRepository') private readonly favoriteRepository: FavoriteRepository,
    private readonly userRepository: UserRepositoryImpl,
    private readonly slackService: SlackService,
  ) {}

  async execute(eventId: number, paginationQuery: PaginationQuery): Promise<Result<[{ email: string }[], Pagination], Error>> {
    try {
      const [userIds, pagination] = await this.favoriteRepository.getUserIdsNotifiedByEvent(eventId, paginationQuery);
      const emails = await this.userRepository.getEmailsByIds(userIds.map((u) => u.userId));
      return Ok([emails.map((e) => ({ email: e })), pagination]);
    } catch (error) {
      await this.slackService.sendError(` Auth Svc - User >>> GetUsersNotifiedByEvent: ${error}`);
      
      return Err(new Error('Failed to fetch notified user emails'));
    }
  }
}
