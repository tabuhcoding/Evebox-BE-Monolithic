import { Injectable, Inject } from '@nestjs/common';
import { Result, Ok, Err } from 'oxide.ts';
import { EventSpecialData } from './getEventSpecialManagement-response.dto';
import { EventsRepository } from 'src/services/event-svc/repository/events/events.repo';
import { GetAdminAccessService } from 'src/services/auth-svc/modules/user/queries/get-admin-access/get-admin-access.service';
import { Pagination } from 'src/shared/constants/pagination';

@Injectable()
export class GetEventSpecialManagementService {
  constructor(
    private readonly getAdminAccessService: GetAdminAccessService,
    @Inject('EventsRepository') private readonly eventsRepository: EventsRepository,
  ) {}

  async execute(email: string, filters: any): Promise<Result<[EventSpecialData[], Pagination], Error>> {
    const isAdmin = await this.getAdminAccessService.execute(email);
    if (!isAdmin) {
      return Err(new Error('You do not have permission to get special events'));
    }

    try {
      const page = Number(filters.page) > 0 ? Number(filters.page) : 1;
      const limit = Number(filters.limit) > 0 ? Number(filters.limit) : 10;

      const totalItems = await this.eventsRepository.countSpecialEvents(filters);
      const totalPages = Math.ceil(totalItems / limit);

      const events = await this.eventsRepository.getSpecialEventsWithFilters({
        ...filters,
        page,
        limit,
      });

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

      const pagination: Pagination = {
        totalItems,
        totalPages,
        page,
        limit,
      };

      return Ok([formattedEvents, pagination]);
    } catch (error) {
      return Err(new Error('Failed to get special events'));
    }
  }
}
