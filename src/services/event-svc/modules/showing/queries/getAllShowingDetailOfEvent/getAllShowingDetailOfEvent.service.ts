import { Inject, Injectable } from '@nestjs/common';
import { Err, Ok, Result } from 'oxide.ts';
import { EventsRepository } from 'src/services/event-svc/repository/events/events.repo';
import { ShowingRepository } from 'src/services/event-svc/repository/showing/showing.repo';

@Injectable()
export class GetAllShowingDetailOfEventService {
  constructor(
    @Inject('EventsRepository') private readonly eventsRepo: EventsRepository,
    @Inject('ShowingRepository') private readonly showingRepo: ShowingRepository,
  ) {}

  async findAll(email: string, eventId: number): Promise<Result<any[], Error>> {
    try {
      const isAuthor = await this.eventsRepo.isEventOwner(email, eventId);
      if (isAuthor.isErr()) return Err(new Error('Failed to check author'));
      if (!isAuthor.unwrap()) return Err(new Error('Unauthorized'));

      const showings = await this.showingRepo.findAllWithTicketTypesByEventId(eventId);
      return Ok(showings);
    } catch {
      return Err(new Error('Failed to retrieve event showings'));
    }
  }
}
