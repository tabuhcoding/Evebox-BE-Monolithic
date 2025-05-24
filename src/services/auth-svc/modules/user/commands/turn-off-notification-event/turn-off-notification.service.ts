import { Inject, Injectable } from '@nestjs/common';
import { Result, Ok, Err } from 'oxide.ts';
import { Email } from 'src/services/auth-svc/modules/user/domain/value-objects/user/email.vo';
import { FavoriteRepository } from 'src/services/auth-svc/repository/favorite/favorite.repo';
import { UserRepositoryImpl } from 'src/services/auth-svc/repository/users/user.repository.impl';

@Injectable()
export class TurnOffNotificationServiceForEvent {
   constructor(
        @Inject('FavoriteRepository') private readonly favoriteRepository: FavoriteRepository,
        private readonly userRepository: UserRepositoryImpl
    ) {}

  async execute(eventIdStr: string, emailStr: string): Promise<Result<boolean, Error>> {
    const emailOrError = Email.create(emailStr);
    if (emailOrError.isErr()) return Err(new Error('Invalid email'));
    const email = emailOrError.unwrap();

    const user = await this.userRepository.findByEmail(email);
    if (!user) return Err(new Error('User not found'));

    const eventId = parseInt(eventIdStr);
    if (isNaN(eventId)) return Err(new Error('Invalid event ID'));

    const existing = await this.favoriteRepository.findFavorite(
        user.id.value,
        'EVENT',
        undefined,
        eventId,
      ); 
    
    if (!existing) return Err(new Error('Favorite record not found'));

    try {
      await this.favoriteRepository.updateIsNotified(existing.id, false);
      return Ok(true);
    } catch (error) {
      return Err(error instanceof Error ? error : new Error('Unknown error'));
    }
  }
}
