import { Inject, Injectable } from '@nestjs/common';
import { Result, Ok, Err } from 'oxide.ts';
import { FavoriteRepository } from 'src/services/auth-svc/repository/favorite/favorite.repo';
import { UserRepositoryImpl } from 'src/services/auth-svc/repository/users/user.repository.impl';
import { Email } from '../../domain/value-objects/user/email.vo';
import { GetEventsByIdsService } from 'src/services/event-svc/modules/event/queries/getEventsById/GetEventsByIds.service';

@Injectable()
export class GetFavoriteEventService {
constructor(
    @Inject('FavoriteRepository') private readonly favoriteRepository: FavoriteRepository,
    private readonly userRepository: UserRepositoryImpl,
    private readonly getEventsByIdsService: GetEventsByIdsService,
  ) {}
  
 async execute(email: string): Promise<Result<any[], Error>> {
    const emailOrError = Email.create(email);
    if (emailOrError.isErr()) {
      return Err(new Error('Invalid email format'));
    }
    const emailStr = emailOrError.unwrap();
    const user = await this.userRepository.findByEmail(emailStr);
    if (!user) return Err(new Error('User not found'));

    const eventIds = await this.favoriteRepository.getFavoriteEventIds(user.id.value);
    if (!eventIds.length) return Ok([]);
    console.log(eventIds)

    try {
      const events = await this.getEventsByIdsService.getEventsByIds(eventIds);
      return Ok(events);
    } catch (error) {
      console.error('Failed to fetch favorite event details:', error);
      return Err(new Error('Failed to retrieve events'));
    }
  }
}
