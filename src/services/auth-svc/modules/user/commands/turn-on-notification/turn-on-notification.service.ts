import { Inject, Injectable } from '@nestjs/common';
import { Result, Ok, Err } from 'oxide.ts';
import { TurnOnNotificationDto } from './turn-on-notification.dto';
import { Email } from 'src/services/auth-svc/modules/user/domain/value-objects/user/email.vo';
import { UserRepositoryImpl } from 'src/services/auth-svc/repository/users/user.repository.impl';
import { FavoriteRepository } from 'src/services/auth-svc/repository/favorite/favorite.repo';
import { UserId } from '../../domain/value-objects/user/user-id.vo';

@Injectable()
export class TurnOnNotificationService {
  constructor(
      @Inject('FavoriteRepository') private readonly favoriteRepository: FavoriteRepository,
      private readonly userRepository: UserRepositoryImpl
  ) {}

  async execute(dto: TurnOnNotificationDto, emailStr: string): Promise<Result<boolean, Error>> {
    const emailOrError = Email.create(emailStr);
    if (emailOrError.isErr()) {
      return Err(new Error('Invalid email'));
    }

    const email = emailOrError.unwrap();
    const user = await this.userRepository.findByEmail(email);
        if (!user) {
          return Err(new Error('User not found'));
        }
    
    const userId: UserId = user.id;

    const receiveNoti = await this.userRepository.getReceiveNotiByUserId(userId.value);
    if (!receiveNoti) return Err(new Error('You must enable notifications in your profile.'));
    let existing;

    if (dto.itemType == 'EVENT'){
      existing = await this.favoriteRepository.findFavorite(
        userId.value,
        dto.itemType,
        undefined,
        parseInt(dto.itemId),
      );    
    }
    else{
       existing = await this.favoriteRepository.findFavorite(
        userId.value,
        dto.itemType,
        dto.itemId,
        undefined,
      ); 
    }
    
    if (!existing) return Err(new Error('Favorite record not found'));
    
    try {
      await this.favoriteRepository.updateIsNotified(existing.id, true);
      return Ok(true);
    } catch (error) {
      return Err(error instanceof Error ? error : new Error('Unknown error'));
    }
  }
}