import { Inject, Injectable } from '@nestjs/common';
import { Result, Ok, Err } from 'oxide.ts';
import { FavoriteRepository } from 'src/services/auth-svc/repository/favorite/favorite.repo';
import { UserRepositoryImpl } from 'src/services/auth-svc/repository/users/user.repository.impl';
import { Email } from '../../domain/value-objects/user/email.vo';

@Injectable()
export class TurnOffNotificationServiceForOrg {
 constructor(
         @Inject('FavoriteRepository') private readonly favoriteRepository: FavoriteRepository,
         private readonly userRepository: UserRepositoryImpl
     ) {}
 
   async execute(ordId: string, emailStr: string): Promise<Result<boolean, Error>> {
     const emailOrError = Email.create(emailStr);
     if (emailOrError.isErr()) return Err(new Error('Invalid email'));
     const email = emailOrError.unwrap();
 
     const user = await this.userRepository.findByEmail(email);
     if (!user) return Err(new Error('User not found'));
 
     if (!ordId) return Err(new Error('Invalid org ID'));
 
     const existing = await this.favoriteRepository.findFavorite(
         user.id.value,
         'ORG',
         ordId,
         undefined,
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
