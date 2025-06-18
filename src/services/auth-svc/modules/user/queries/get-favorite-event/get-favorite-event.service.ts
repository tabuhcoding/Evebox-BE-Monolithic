import { Inject, Injectable } from '@nestjs/common';
import { Result, Ok, Err } from 'oxide.ts';
import { FavoriteRepository } from 'src/services/auth-svc/repository/favorite/favorite.repo';
import { UserRepositoryImpl } from 'src/services/auth-svc/repository/users/user.repository.impl';
import { Email } from '../../domain/value-objects/user/email.vo';
import { GetEventsByIdsService } from 'src/services/event-svc/modules/event/queries/getEventsById/GetEventsByIds.service';
import { SlackService } from "src/infrastructure/adapters/slack/slack.service";
import { GetEventDetailDto } from 'src/services/event-svc/modules/event/queries/getEventsById/GetEventsByIds.dto';
import { Pagination, PaginationQuery } from 'src/shared/constants/pagination';
import { FavoriteEventResponseData } from './get-favorite-event.dto';

@Injectable()
export class GetFavoriteEventService {
constructor(
    @Inject('FavoriteRepository') private readonly favoriteRepository: FavoriteRepository,
    private readonly userRepository: UserRepositoryImpl,
    private readonly getEventsByIdsService: GetEventsByIdsService,
    private readonly slackService: SlackService,
  ) {}
  
 async execute(email: string, pagination: PaginationQuery): Promise<Result<[FavoriteEventResponseData[], Pagination], Error>> {
    const emailOrError = Email.create(email);
    if (emailOrError.isErr()) {
      return Err(new Error('Invalid email format'));
    }
    const emailStr = emailOrError.unwrap();
    const user = await this.userRepository.findByEmail(emailStr);
    if (!user) return Err(new Error('User not found'));

    const [eventIds, paginationResponse] = await this.favoriteRepository.getFavoriteEventIds(emailStr.value, pagination);
    if (!eventIds.length) return Ok([[], new Pagination()]);

    try {
      const events = await this.getEventsByIdsService.getFavEventsByIds(eventIds);
      return Ok([events, paginationResponse]);
    } catch (error) {
      await this.slackService.sendError(` Auth Svc - User >>> GetFavoriteEvent: ${error}`);
      
      return Err(new Error("Failed to retrieve events"));
    }
  }
}
