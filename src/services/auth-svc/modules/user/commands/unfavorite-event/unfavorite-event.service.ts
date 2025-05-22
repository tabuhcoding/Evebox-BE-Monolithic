import { UserRepositoryImpl } from 'src/services/auth-svc/repository/users/user.repository.impl';
import { Inject, Injectable } from '@nestjs/common';
import { Result, Ok, Err } from 'oxide.ts';
import { FavoriteRepository } from 'src/services/auth-svc/repository/favorite/favorite.repo';
import { Email } from '../../domain/value-objects/user/email.vo';

@Injectable()
export class UnfavoriteEventService {
  constructor(
    @Inject('FavoriteRepository') private readonly favoriteRepository: FavoriteRepository,
    private readonly userRepository: UserRepositoryImpl
  ) {}

  async execute(userEmail: string, eventId: number): Promise<Result<boolean, Error>> {
    const emailOrError = Email.create(userEmail);
    if (emailOrError.isErr()) {
      return Err(new Error('Invalid email'));
    }
    const email = emailOrError.unwrap();

    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      return Err(new Error('User not found'));
    }

    const favorite = await this.favoriteRepository.findFavorite(
      user.id.value,
      'EVENT',
      eventId.toString()
    );

    if (!favorite || !favorite.isFavorite) {
      return Err(new Error('Favorite record not found or already unfavorited'));
    }

    try {
      await this.favoriteRepository.updateFavoriteStatus(favorite.id, false);
      return Ok(true);
    } catch (error) {
      return Err(new Error(error.message || 'Failed to unfavorite event'));
    }
  }
}
