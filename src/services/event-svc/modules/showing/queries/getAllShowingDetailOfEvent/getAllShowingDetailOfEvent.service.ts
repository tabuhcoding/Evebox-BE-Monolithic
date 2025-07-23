import { Inject, Injectable } from '@nestjs/common';
import { Err, Ok, Result } from 'oxide.ts';
import { FindUserByEmailService } from 'src/services/auth-svc/modules/user/commands/find-user-by-email/findUserByEmail.service';
import { EventsRepository } from 'src/services/event-svc/repository/events/events.repo';
import { EventUserRelationshipRepository } from 'src/services/event-svc/repository/eventUserRelationship/eventUserRelationship.repo';
import { Showing, ShowingRepository } from 'src/services/event-svc/repository/showing/showing.repo';
import { EVENT_ROLE } from '../../../event/domain/eventRole';

@Injectable()
export class GetAllShowingDetailOfEventService {
  constructor(
    @Inject('EventsRepository') private readonly eventsRepo: EventsRepository,
    @Inject('ShowingRepository') private readonly showingRepo: ShowingRepository,
    private readonly findUserByEmail: FindUserByEmailService,    
    @Inject('EventUserRelationshipRepository') private readonly eventUserRepo: EventUserRelationshipRepository,
  ) {}

  async findAll(email: string, eventId: number): Promise<Result<any[], Error>> {
    try {
      const user = await this.findUserByEmail.execute(email);
      if (!user) return Err(new Error('User not found'));

      const isAuthor = await this.eventsRepo.isEventOwner(email, eventId);
      const isSummarized = await this.eventsRepo.hasPermissionToManageEvent(eventId, email, EVENT_ROLE.IS_SUMMARIZED);
      const viewOrder = await this.eventsRepo.hasPermissionToManageEvent(eventId, email, EVENT_ROLE.VIEW_ORDER);
      const viewMarketing = await this.eventsRepo.hasPermissionToManageEvent(eventId, email, EVENT_ROLE.MARKETING);
      const viewCheckin = await this.eventsRepo.hasPermissionToManageEvent(eventId, email, EVENT_ROLE.CHECKIN);

      if (!isAuthor.unwrap() && !isSummarized && !viewOrder && !viewMarketing && !viewCheckin) return Err(new Error('Unauthorized'));

      const showings = await this.showingRepo.findAllWithTicketTypesByEventId(eventId);
      return Ok(showings);
    } catch {
      return Err(new Error('Failed to retrieve event showings'));
    }
  }

  async findAllId(email: string, eventId: number): Promise<Result<string[], Error>> {
    try {
      const user = await this.findUserByEmail.execute(email);
      if (!user) return Err(new Error('User not found'));

      const isAuthor = await this.eventsRepo.isEventOwner(email, eventId);
      const isSummarized = await this.eventsRepo.hasPermissionToManageEvent(eventId, email, EVENT_ROLE.IS_SUMMARIZED);
      const viewOrder = await this.eventsRepo.hasPermissionToManageEvent(eventId, email, EVENT_ROLE.VIEW_ORDER);
      const viewMarketing = await this.eventsRepo.hasPermissionToManageEvent(eventId, email, EVENT_ROLE.MARKETING);
      const viewCheckin = await this.eventsRepo.hasPermissionToManageEvent(eventId, email, EVENT_ROLE.CHECKIN);

      if (!isAuthor.unwrap() && !isSummarized && !viewOrder && !viewMarketing && !viewCheckin) return Err(new Error('Unauthorized'));

      const showings = await this.showingRepo.findAll({
        eventId: eventId,
      });
      return Ok(showings.map(showing => showing.id));
    } catch {
      return Err(new Error('Failed to retrieve event showings'));
    }
  }

  async findShowingCanEditSeatmap(showingId: string): Promise<Result<Showing, Error>> {
    try {
      const showing = await this.showingRepo.findOne({
        id: showingId,
        // TicketType: {
        //   every: {
        //     startTime: {
        //       lte: new Date(),
        //     }
        //   }
        // },
        startTime: {
          lte: new Date(),
        }
      }, {
        TicketType: true,
      });

      if (!showing) return Err(new Error('Showing not found'));

      return Ok(showing);
    } catch (error) {
      return Err(new Error('Failed to retrieve showing details'));
    }
  }
}
