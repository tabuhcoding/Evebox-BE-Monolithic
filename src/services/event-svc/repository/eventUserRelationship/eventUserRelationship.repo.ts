import { BaseRepository } from "src/shared/repo/base.repository";
import { EventUserRelationship } from "@prisma/client";
import { Prisma } from "@prisma/client";
import { Result } from "oxide.ts";

export { EventUserRelationship }

export interface EventUserRelationshipRepository 
  extends BaseRepository<EventUserRelationship, Prisma.EventUserRelationshipDelegate> {
  // Thêm các method riêng cho EventUserRelationship nếu cần, ví dụ:

}