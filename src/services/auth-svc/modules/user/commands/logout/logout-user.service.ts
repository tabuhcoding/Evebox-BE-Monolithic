import { Injectable } from '@nestjs/common';
import { UserRepositoryImpl } from 'src/services/auth-svc/repository/users/user.repository.impl';
import { Result, Ok, Err } from 'oxide.ts';
import { USER_MESSAGES } from 'src/shared/constants/constants';

@Injectable()
export class LogoutUserService {
  constructor(
    private readonly userRepository: UserRepositoryImpl,
  ) {}

  async execute(email: string): Promise<Result<void, Error>> {
    try {
      // Revoke token if valid
      await this.userRepository.revokeAllRefreshTokens(email);
      console.log('Revoke all refresh tokens for user:', email);
      
      return Ok(void 0);
    } catch (error) {
      return Err(new Error(USER_MESSAGES.ERRORS.LOGOUT_FAILED(error.message)));
    }
  }
}
