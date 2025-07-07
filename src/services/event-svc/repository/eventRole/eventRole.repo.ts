import { BaseEventRepository } from '../base.repository';
import { EventRole } from "prisma/client-event";
import { Prisma } from "prisma/client-event";

export { EventRole }

export interface EventRoleRepository 
  extends BaseEventRepository<EventRole, Prisma.EventRoleDelegate> {
  // Thêm các method riêng cho EventUserRelationship nếu cần, ví dụ:

}