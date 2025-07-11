import { Inject, Injectable } from '@nestjs/common';
import { Result, Ok, Err } from 'oxide.ts';
import { UserRepositoryImpl } from 'src/services/auth-svc/repository/users/user.repository.impl';

@Injectable()
export class UpdateUserToOrgService {
  constructor(private readonly userRepository: UserRepositoryImpl) {}

  async execute(email: string): Promise<Result<{ message: string }, Error>> {
    try {
      const success = await this.userRepository.updateUserRoleToOrganizer(email);

      if (!success) {
        return Err(new Error('Failed to update user role to organizer'));
      }

      return Ok({ message: 'User role updated to organizer successfully' });
    } catch (error) {
      return Err(new Error('Internal error occurred while updating user role'));
    }
  }
}
