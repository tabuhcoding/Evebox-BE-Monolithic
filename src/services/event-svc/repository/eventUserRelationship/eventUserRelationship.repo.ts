import { BaseEventRepository } from '../base.repository';
import { EventUserRelationship } from "prisma/client-event";
import { Prisma } from "prisma/client-event";
import { Result } from "oxide.ts";
import { AddEventMemberDto } from "../../modules/event/commands/AddEventMember/addEventMember.dto";
import { UpdateEventMemberDto } from "../../modules/event/commands/UpdateEventMember/updateEventMember.dto";

export { EventUserRelationship }

export interface EventUserRelationshipRepository 
  extends BaseEventRepository<EventUserRelationship, Prisma.EventUserRelationshipDelegate> {
  // Thêm các method riêng cho EventUserRelationship nếu cần, ví dụ:
   hasPermissionToManageMembers(eventId: number, userId: string, email: string): Promise<boolean>;
   addMember(eventId: number,userId: string, email: string, dto: AddEventMemberDto): Promise<EventUserRelationship>;
   updateMember(eventId: number, userId: string, dto: UpdateEventMemberDto): Promise<EventUserRelationship | null>;
   getMember(eventId: number, userId: string): Promise<any>;
   softDeleteMember(eventId: number, userId: string): Promise<any>;
}