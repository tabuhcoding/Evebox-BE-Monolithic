// src/modules/auth/repositories/auth.repository.ts
import { User } from '../../modules/user/domain/entities/user.entity';
import { Email } from '../../modules/user/domain/value-objects/user/email.vo';

export interface UserRepository {
  findByEmail(email: Email): Promise<User | null>;
  save(user: User): Promise<void>;
}
