import { User, UserStatus } from "@prisma/client";

export interface AdminRepository {
  updateUserStatus(userId: string, status: UserStatus): Promise<void>
}