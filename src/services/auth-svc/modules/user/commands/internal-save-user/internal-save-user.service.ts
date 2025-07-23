// src/modules/user/commands/internal-save-user/internal-save-user.service.ts

import { Inject, Injectable } from '@nestjs/common';
import { UserRepositoryImpl } from 'src/services/auth-svc/repository/users/user.repository.impl';
import { User } from '../../domain/entities/user.entity';

@Injectable()
export class InternalSaveUserService {
  constructor(
    @Inject('UserRepository') private readonly userRepository: UserRepositoryImpl,
  ) {}

  async saveUser(user: User) {
    return this.userRepository.save(user);
  }

  async saveRefreshToken(refreshToken: string, email: string, expiresAt: Date) {
    return this.userRepository.saveRefreshToken(refreshToken, email, expiresAt);
  }
}
