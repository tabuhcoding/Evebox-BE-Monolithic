import { Inject, Injectable } from '@nestjs/common';
import { Result, Ok, Err } from 'oxide.ts';
import { CreateFavoriteDto } from './create-favorite.dto';
import { FavoriteRepository } from '../../../../repository/favorite/favorite.repo';
import { UserRepository } from 'src/services/auth-svc/repository/users/user.repository';
import { Email } from '../../domain/value-objects/user/email.vo';
import { UserId } from '../../domain/value-objects/user/user-id.vo';
import { UserRepositoryImpl } from 'src/services/auth-svc/repository/users/user.repository.impl';

@Injectable()
export class AddToFavoriteService {
  constructor(
    @Inject('FavoriteRepository') private readonly favoriteRepository: FavoriteRepository,
    private readonly userRepository: UserRepositoryImpl
  ) {}

  async execute(dto: CreateFavoriteDto, emailStr: string): Promise<Result<boolean, Error>> {
    const emailOrError = Email.create(emailStr);
    if (emailOrError.isErr()) {
      return Err(new Error('Invalid email format'));
    }
    const email = emailOrError.unwrap();

    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      return Err(new Error('User not found'));
    }

    const userId: UserId = user.id;

    try {
      const existing = await this.favoriteRepository.findFavorite(
        userId.value,
        dto.itemType,
        dto.itemId,
      );

      if (existing) {
        if (existing.isFavorite) {
          return Ok(true); // Already favorited
        } else {
          await this.favoriteRepository.updateFavoriteStatus(existing.id, true);
          return Ok(true);
        }
      }

      // Determine how to assign itemId
      const isEvent = dto.itemType === 'EVENT';
      const eventId = isEvent ? parseInt(dto.itemId) : null;
      const orgId = isEvent ? null : dto.itemId;

      await this.favoriteRepository.addFavorite(
        userId.value,
        dto.itemType,
        orgId,
        eventId,
      );

      return Ok(true);
    } catch (error) {
      return Err(new Error(`Failed to add favorite: ${error.message}`));
    }
  }
}
