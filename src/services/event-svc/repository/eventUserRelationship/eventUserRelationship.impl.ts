import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "src/infrastructure/database/prisma/prisma.service";
import { BaseRepository } from "src/shared/repo/base.repository";
import { EventUserRelationship, Prisma } from "@prisma/client";
import { EventUserRelationshipRepository } from "./eventUserRelationship.repo";
import { Result } from "oxide.ts";
import { AddEventMemberDto } from "../../modules/event/commands/AddEventMember/addEventMember.dto";
import { UpdateEventMemberDto } from "../../modules/event/commands/UpdateEventMember/updateEventMember.dto";

@Injectable()
export class EventUserRelationshipRepositoryImpl
  extends BaseRepository<EventUserRelationship, Prisma.EventUserRelationshipDelegate>
  implements EventUserRelationshipRepository {
  constructor(protected readonly prisma: PrismaService) {
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

  async addMember(eventId: number, dto: AddEventMemberDto): Promise<EventUserRelationship> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) throw new NotFoundException(`User with email ${dto.email} not found`);

    const role_desc = this.roleMap[dto.role];
    if (!role_desc) throw new BadRequestException('Invalid role number');

    const existing = await this.prisma.eventUserRelationship.findUnique({
      where: {
        eventId_userId: {
          eventId,
          userId: user.id,
        },
      },
    });

    if (existing) {
      if (existing.isDeleted) {
        return this.prisma.eventUserRelationship.update({
          where: { eventId_userId: { eventId, userId: user.id } },
          data: { isDeleted: false, role: dto.role, role_desc },
        });
      } else {
        throw new BadRequestException('Already added member');
      }
    }

    return this.prisma.eventUserRelationship.create({
      data: {
        eventId,
        userId: user.id,
        email: user.email,
        role: dto.role,
        role_desc,
      },
    });
  }
async updateMember(eventId: number, dto: UpdateEventMemberDto): Promise<EventUserRelationship | null> {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user) throw new NotFoundException(`User with email ${dto.email} not found`);

    const role_desc = this.roleMap[dto.role];
    if (!role_desc) throw new BadRequestException('Invalid role number');

    const existing = await this.prisma.eventUserRelationship.findUnique({
      where: {
        eventId_userId: {
          eventId,
          userId: user.id,
        },
      },
    });

    if (!existing) throw new NotFoundException('Member not found');

    return this.prisma.eventUserRelationship.update({
      where: {
        eventId_userId: {
          eventId,
          userId: user.id,
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