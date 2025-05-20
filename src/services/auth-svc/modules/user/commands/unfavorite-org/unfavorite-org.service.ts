import { Inject, Injectable } from '@nestjs/common';
import { Result, Ok, Err } from 'oxide.ts';
import { Email } from 'src/services/auth-svc/modules/user/domain/value-objects/user/email.vo';
import { FavoriteRepository } from 'src/services/auth-svc/repository/favorite/favorite.repo';
import { UserRepositoryImpl } from 'src/services/auth-svc/repository/users/user.repository.impl';

@Injectable()
export class UnfavoriteOrgService {
 constructor(
     @Inject('FavoriteRepository') private readonly favoriteRepository: FavoriteRepository,
     private readonly userRepository: UserRepositoryImpl
  ) {}

  async execute(userEmail: string, orgId: string): Promise<Result<boolean, Error>> {
    const emailOrError = Email.create(userEmail);
    if (emailOrError.isErr()) {
      return Err(new Error('Invalid email format'));
    }
    const email = emailOrError.unwrap();

    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      return Err(new Error('User not found'));
    }

    const favorite = await this.favoriteRepository.findFavorite(
      user.id.value,
      'ORG', // assuming 2 = organization itemType
      orgId
    );

    if (!favorite || !favorite.isFavorite) {
      return Err(new Error('Favorite record not found or already unfavorited'));
    }

    try {
      await this.favoriteRepository.updateFavoriteStatus(favorite.id, false);
      return Ok(true);
    } catch (error) {
      return Err(new Error(error.message || 'Failed to unfavorite organization'));
    }
  }
}
