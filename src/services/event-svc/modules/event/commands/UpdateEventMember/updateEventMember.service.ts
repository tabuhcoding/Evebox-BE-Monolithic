import { Inject, Injectable } from '@nestjs/common';
import { Result, Ok, Err } from 'oxide.ts';
import { UpdateEventMemberDto } from './updateEventMember.dto';
import { UpdateEventMemberResponseDto } from './updateEventMember-response.dto';
import { EventUserRelationshipRepository } from 'src/services/event-svc/repository/eventUserRelationship/eventUserRelationship.repo';
import { EventsRepository } from 'src/services/event-svc/repository/events/events.repo';
import { FindUserByEmailService } from 'src/services/auth-svc/modules/user/commands/find-user-by-email/findUserByEmail.service';

@Injectable()
export class UpdateEventMemberService {
  constructor(
    @Inject('EventUserRelationshipRepository') private readonly eventUserRepo: EventUserRelationshipRepository,
        private readonly findUserByEmail: FindUserByEmailService, 
        @Inject('EventsRepository') private readonly eventRepo: EventsRepository
  ) {}

  async execute(
    eventId: number,
    dto: UpdateEventMemberDto,
    currentEmail: string,
  ): Promise<Result<UpdateEventMemberResponseDto, Error>> {
    try {
      const event = await this.eventRepo.findEventById(eventId);
      if (!event) return Err(new Error('Event not found'));

      const user = await this.findUserByEmail.execute(currentEmail);
      if (!user) return Err(new Error('User not found'));

      const canManage = await this.eventUserRepo.hasPermissionToManageMembers(eventId, user.id.value, currentEmail);
      if (!canManage) return Err(new Error('You do not have permission to manage members.'));

      const updated = await this.eventUserRepo.updateMember(eventId, dto);
      if (!updated) return Err(new Error('Failed to update member'));

      return Ok({
        statusCode: 200,
        message: 'Member updated successfully',
        data: {
          eventId: updated.eventId,
          userId: updated.userId,
          email: updated.email,
          role: updated.role,
          role_desc: updated.role_desc,
          createdAt: updated.createdAt,
        },
      });
    } catch (error) {
      console.error('[UpdateEventMemberService] Error:', error);
      return Err(new Error('Failed to update member'));
    }
  }
}
