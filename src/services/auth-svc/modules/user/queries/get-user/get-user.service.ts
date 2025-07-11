import { Injectable } from '@nestjs/common';
import { UserRepositoryImpl } from 'src/services/auth-svc/repository/users/user.repository.impl';
import { Email } from '../../domain/value-objects/user/email.vo';
import { Err, Ok, Result } from 'oxide.ts';
import { Pagination, PaginationQuery } from 'src/shared/constants/pagination';

@Injectable()
export class GetUserService {
  constructor(
    private readonly userRepository: UserRepositoryImpl,
  ) {}

  async execute(email: string): Promise<Result<{
    id: string, name: string, email: string, role: number, phone: string,
  }, Error>> {
    try {
        const emailOrError = Email.create(email);
    if (emailOrError.isErr()) {
      return Err(emailOrError.unwrapErr());
    }

    const user = await this.userRepository.findByEmail(emailOrError.unwrap());
    
    if (user != null) {
      return Ok({
        id: user.id.value, 
        name: user.name.value, 
        email: user.email.value,
        role: user.role.getValue(), 
        phone: user.phone.value,
        avatar_id: user.avatarId,
        receiveNoti: user.receiveNoti,
      });
    }
    } catch (error) {
      return Err(new Error('Failed to get user'));
    }
  }

  async getUserWithSearch(search: string, paginationQuery: PaginationQuery): Promise<[string[], Pagination]> {
    try {
      const pagination: PaginationQuery = {
        page: paginationQuery.page >> 0 || 1,
        limit: paginationQuery.limit >> 0 || 10,
      };

      const totalItems = await this.userRepository.countWithSearch(search);
      const totalPages = Math.ceil(totalItems / pagination.limit);

      const paginationResult: Pagination = {
        page: pagination.page,
        limit: pagination.limit,
        totalItems: totalItems,
        totalPages: totalPages,
      };

      const userIds = await this.userRepository.getUsersWithSearch(search, pagination);
      if (!userIds || userIds.length === 0) {
        return [[], paginationResult];
      }

      return [userIds, paginationResult];
    } catch (error) {
      throw new Error('Failed to get users with search');
    }
  }
}
