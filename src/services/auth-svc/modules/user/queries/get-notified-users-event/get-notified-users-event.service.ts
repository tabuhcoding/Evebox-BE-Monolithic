import { Inject, Injectable } from '@nestjs/common';
import { Result, Ok, Err } from 'oxide.ts';
import { FavoriteRepository } from 'src/services/auth-svc/repository/favorite/favorite.repo';
import { UserRepositoryImpl } from 'src/services/auth-svc/repository/users/user.repository.impl';
import { SlackService } from "src/infrastructure/adapters/slack/slack.service";

@Injectable()
export class GetUsersNotifiedByEventService {
  constructor(
    @Inject('FavoriteRepository') private readonly favoriteRepository: FavoriteRepository,
    private readonly userRepository: UserRepositoryImpl,
    private readonly slackService: SlackService,
  ) {}

  async execute(eventId: number): Promise<Result<{ email: string }[], Error>> {
    try {
      const userIds = await this.favoriteRepository.getUserIdsNotifiedByEvent(eventId);
      return Ok(userIds.map(user => ({ email: user.userId })));
    } catch (error) {
      await this.slackService.sendError(` Auth Svc - User >>> GetUsersNotifiedByEvent: ${error}`);
      
      return Err(new Error('Failed to fetch notified user emails'));
    }
  }
}
