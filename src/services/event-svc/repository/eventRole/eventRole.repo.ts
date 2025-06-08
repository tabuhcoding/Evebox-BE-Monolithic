import { BaseRepository } from "src/shared/repo/base.repository";
import { EventRole } from "@prisma/client";
import { Prisma } from "@prisma/client";

export { EventRole }

export interface EventRoleRepository 
  extends BaseRepository<EventRole, Prisma.EventRoleDelegate> {
  // Thêm các method riêng cho EventUserRelationship nếu cần, ví dụ:

}