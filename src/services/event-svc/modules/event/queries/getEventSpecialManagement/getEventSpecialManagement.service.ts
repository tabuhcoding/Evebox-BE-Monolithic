import { Injectable, Inject } from '@nestjs/common';
import { Result, Ok, Err } from 'oxide.ts';
import { EventSpecialData } from './getEventSpecialManagement-response.dto';
import { EventsRepository } from 'src/services/event-svc/repository/events/events.repo';
import { GetAdminAccessService } from 'src/services/auth-svc/modules/user/queries/get-admin-access/get-admin-access.service';

@Injectable()
export class GetEventSpecialManagementService {
  constructor(
    private readonly getAdminAccessService: GetAdminAccessService,
    @Inject('EventsRepository') private readonly eventsRepository: EventsRepository,
  ) {}

  async execute(email: string, filters: any): Promise<Result<EventSpecialData[], Error>> {
    const isAdmin = await this.getAdminAccessService.execute(email);
    if (!isAdmin) {
      return Err(new Error('You do not have permission to get special events'));
    }

    try {
      const events = await this.eventsRepository.getSpecialEventsWithFilters(filters);

      const formattedEvents: EventSpecialData[] = events.map((event) => ({
        id: event.id,
        title: event.title,
        isSpecial: event.isSpecial,
        isOnlyOnEve: event.isOnlyOnEve,
        imgPosterUrl: event.imgPosterUrl || '',
        categoryIds: event.EventCategories.map((ec) => ({
          id: ec.Categories.id,
          name: ec.Categories.name,
        })),
      }));

      return Ok(formattedEvents);
    } catch (error) {
      return Err(new Error('Failed to get special events'));
    }
  }

  async count(filters: any): Promise<number> {
    return this.eventsRepository.countSpecialEvents(filters);
  }
}
