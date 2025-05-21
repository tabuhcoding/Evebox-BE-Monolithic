import { Inject, Injectable } from '@nestjs/common';
import { Result, Ok, Err } from 'oxide.ts';
import { UserRepository } from 'src/services/auth-svc/repository/users/user.repository';
import { Email } from 'src/services/auth-svc/modules/user/domain/value-objects/user/email.vo';
import { FavoriteRepository } from 'src/services/auth-svc/repository/favorite/favorite.repo';
import { UserRepositoryImpl } from 'src/services/auth-svc/repository/users/user.repository.impl';

@Injectable()
export class GetFavoriteOrgService {
  constructor(
    @Inject('FavoriteRepository') private readonly favoriteRepository: FavoriteRepository,
    private readonly userRepository: UserRepositoryImpl
  ) {}

  async execute(emailStr: string): Promise<Result<{ orgId: string }[], Error>> {
    const emailOrError = Email.create(emailStr);
    if (emailOrError.isErr()) {
      return Err(new Error('Invalid email format'));
    }

    const email = emailOrError.unwrap();
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      return Err(new Error('User not found'));
    }

    try {
      const orgs = await this.favoriteRepository.getFavoriteOrgs(user.id.value);
      return Ok(orgs);
    } catch (err) {
      return Err(new Error('Failed to get favorite organizers'));
    }
  }
}
