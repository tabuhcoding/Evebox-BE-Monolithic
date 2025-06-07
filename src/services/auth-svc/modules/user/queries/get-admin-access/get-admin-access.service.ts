// src/services/auth-svc/modules/user/queries/check-admin/getAdminAccess.service.ts
import { Injectable } from '@nestjs/common';
import { UserRepositoryImpl } from '../../../../repository/users/user.repository.impl';

@Injectable()
export class GetAdminAccessService {
  constructor(private readonly userRepo: UserRepositoryImpl) {}

  async execute(email: string): Promise<boolean> {
    return this.userRepo.isAdmin(email);
  }
}
