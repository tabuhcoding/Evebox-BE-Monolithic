import { Inject, Injectable } from '@nestjs/common';
import { Result, Ok, Err } from 'oxide.ts';
import { FindUserByEmailService } from 'src/services/auth-svc/modules/user/commands/find-user-by-email/findUserByEmail.service';
import { EventsRepository } from 'src/services/event-svc/repository/events/events.repo';
import { EventUserRelationshipRepository } from 'src/services/event-svc/repository/eventUserRelationship/eventUserRelationship.repo';

@Injectable()
export class DeleteEventMemberService {
  constructor(
    @Inject('EventUserRelationshipRepository') private readonly eventUserRepo: EventUserRelationshipRepository,
        private readonly findUserByEmail: FindUserByEmailService, 
        @Inject('EventsRepository') private readonly eventRepo: EventsRepository
  ) {}

  async execute(
    eventId: number,
    currentEmail: string,
    targetEmail: string
  ): Promise<Result<{ message: string }, Error>> {
    try {
      const event = await this.eventRepo.findEventById(eventId);
      if (!event) return Err(new Error('Event not found'));

       const user = await this.findUserByEmail.execute(currentEmail);
      if (!user) return Err(new Error('User not found'));

      const hasPermission = await this.eventUserRepo.hasPermissionToManageMembers(eventId, user.email.value, currentEmail);
      if (!hasPermission) return Err(new Error('You do not have permission to manage members.'));

      const targetUser = await this.findUserByEmail.execute(targetEmail);
      if (!targetUser) return Err(new Error('Target user not found'));

      const member = await this.eventUserRepo.getMember(eventId, targetUser.email.value);
      if (!member) return Err(new Error('Member not found'));
      if (member.isDeleted) return Err(new Error('Member already deleted'));

      await this.eventUserRepo.softDeleteMember(eventId, targetUser.email.value);

      return Ok({ message: 'Member soft deleted successfully' });
    } catch (error) {
      console.error('[DeleteEventMemberService] Error:', error);
      return Err(new Error('Failed to delete member'));
    }
  }
}
