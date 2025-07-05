import { Inject, Injectable } from '@nestjs/common';
import { AddEventMemberDto } from './addEventMember.dto';
import { AddEventMemberResponseDto } from './addEventMember-response.dto';
import { Result, Ok, Err } from 'oxide.ts';
import { EventUserRelationshipRepository } from 'src/services/event-svc/repository/eventUserRelationship/eventUserRelationship.repo';
import { EventsRepository } from 'src/services/event-svc/repository/events/events.repo';
import { FindUserByEmailService } from 'src/services/auth-svc/modules/user/commands/find-user-by-email/findUserByEmail.service';

@Injectable()
export class AddEventMemberService {
  constructor(
    @Inject('EventUserRelationshipRepository') private readonly eventUserRepo: EventUserRelationshipRepository,
    private readonly findUserByEmail: FindUserByEmailService, 
    @Inject('EventsRepository') private readonly eventRepo: EventsRepository
  ) {}

  async execute(
    eventId: number,
    dto: AddEventMemberDto,
    currentEmail: string,
  ): Promise<Result<AddEventMemberResponseDto, Error>> {
    try {
      const event = await this.eventRepo.findEventById(eventId);
      if (!event) return Err(new Error(`Event with id ${eventId} not found`));

      const user = await this.findUserByEmail.execute(currentEmail);
      if (!user) return Err(new Error('User not found'));

      const canManage = await this.eventUserRepo.hasPermissionToManageMembers(eventId, user.id.value, currentEmail);
      if (!canManage) return Err(new Error('You do not have permission to manage members.'));

      const member = await this.eventUserRepo.addMember(eventId, dto);
      return Ok({
        statusCode: 201,
        message: 'Member added successfully',
        data: {
          eventId: member.eventId,
          userId: member.userId,
          email: member.email,
          role: member.role,
          role_desc: member.role_desc,
          createdAt: member.createdAt,
        },
      });
    } catch (error) {
      console.error('[AddEventMemberService] Failed to add member:', error);
      return Err(new Error('Failed to add member to event'));
    }
  }
}
