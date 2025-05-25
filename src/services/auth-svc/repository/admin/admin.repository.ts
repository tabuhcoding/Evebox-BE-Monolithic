import { UserStatus } from "@prisma/client";
import { UserRole } from "../../modules/user/domain/enums/user-role.enum";

export interface AdminRepository {
  updateUserStatus(userId: string, status: UserStatus): Promise<void>
  updateUserRole(userId: string, role: UserRole): Promise<void>;
}