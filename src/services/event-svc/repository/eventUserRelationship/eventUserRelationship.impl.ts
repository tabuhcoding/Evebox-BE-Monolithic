import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaEventService } from "../../database/prisma-event/prisma.service";
import { BaseEventRepository } from '../base.repository';
import { EventUserRelationship, Prisma } from "prisma/client-event";
import { EventUserRelationshipRepository } from "./eventUserRelationship.repo";
import { AddEventMemberDto } from "../../modules/event/commands/AddEventMember/addEventMember.dto";
import { UpdateEventMemberDto } from "../../modules/event/commands/UpdateEventMember/updateEventMember.dto";

@Injectable()
export class EventUserRelationshipRepositoryImpl
  extends BaseEventRepository<EventUserRelationship, Prisma.EventUserRelationshipDelegate>
  implements EventUserRelationshipRepository {
  constructor(protected readonly prisma: PrismaEventService) {
    super(prisma.eventUserRelationship, prisma);
  }

   private readonly roleMap: Record<number, string> = {
    1: 'Owner',
    2: 'Editor',
    3: 'Marketer',
    4: 'Check-in Staff',
    5: 'Viewer',
    6: 'Analyst',
  };

   async hasPermissionToManageMembers(eventId: number, userId: string, email: string): Promise<boolean> {
    const event = await this.prisma.events.findUnique({
      where: { id: eventId },
      select: { organizerId: true },
    });

    if (event?.organizerId === email) return true;

    const member = await this.prisma.eventUserRelationship.findUnique({
      where: {
        eventId_userId: {
          eventId,
          userId,
        },
      },
    });

    if (!member || member.isDeleted) return false;

    const role = await this.prisma.eventRole.findUnique({
      where: { id: member.role },
    });

    return !!role?.viewMember;
  }

  async addMember(eventId: number,userId: string, email: string, dto: AddEventMemberDto): Promise<EventUserRelationship> {
    const role_desc = this.roleMap[dto.role];
    if (!role_desc) throw new BadRequestException('Invalid role number');

    const existing = await this.prisma.eventUserRelationship.findUnique({
      where: {
        eventId_userId: {
          eventId,
          userId: userId,
        },
      },
    });

    if (existing) {
      if (existing.isDeleted) {
        return this.prisma.eventUserRelationship.update({
          where: { eventId_userId: { eventId, userId: userId} },
          data: { isDeleted: false, role: dto.role, role_desc },
        });
      } else {
        throw new BadRequestException('Already added member');
      }
    }

    return this.prisma.eventUserRelationship.create({
      data: {
        eventId,
        userId: userId,
        email: email,
        role: dto.role,
        role_desc,
      },
    });
  }
async updateMember(eventId: number, userId: string, dto: UpdateEventMemberDto): Promise<EventUserRelationship | null> {
    const role_desc = this.roleMap[dto.role];
    if (!role_desc) throw new BadRequestException('Invalid role number');

    const existing = await this.prisma.eventUserRelationship.findUnique({
      where: {
        eventId_userId: {
          eventId,
          userId: userId,
        },
      },
    });

    if (!existing) throw new NotFoundException('Member not found');

    return this.prisma.eventUserRelationship.update({
      where: {
        eventId_userId: {
          eventId,
          userId: userId,
        },
      },
      data: {
        role: dto.role,
        role_desc,
      },
    });
  }

  async getMember(eventId: number, userId: string) {
    return this.prisma.eventUserRelationship.findUnique({
      where: {
        eventId_userId: {
          eventId,
          userId,
        },
      },
    });
  }

  async softDeleteMember(eventId: number, userId: string) {
    return this.prisma.eventUserRelationship.update({
      where: {
        eventId_userId: {
          eventId,
          userId,
        },
      },
      data: {
        isDeleted: true,
      },
    });
  }
}