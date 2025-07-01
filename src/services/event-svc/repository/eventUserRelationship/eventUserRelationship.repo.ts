import { BaseEventRepository } from '../base.repository';
import { EventUserRelationship } from "prisma/client-event";
import { Prisma } from "prisma/client-event";
import { Result } from "oxide.ts";

export { EventUserRelationship }

export interface EventUserRelationshipRepository 
  extends BaseEventRepository<EventUserRelationship, Prisma.EventUserRelationshipDelegate> {
  // Thêm các method riêng cho EventUserRelationship nếu cần, ví dụ:

}