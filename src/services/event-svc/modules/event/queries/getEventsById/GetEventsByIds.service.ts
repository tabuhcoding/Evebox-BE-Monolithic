import { Inject, Injectable } from '@nestjs/common';
import { EventsRepository, Events } from '../../../../repository/events/events.repo';
import { GetEventDetailDto } from '../../queries/getEventsById/GetEventsByIds.dto';
import { FavoriteEventResponseData } from 'src/services/auth-svc/modules/user/queries/get-favorite-event/get-favorite-event.dto';

@Injectable()
export class GetEventsByIdsService {
  constructor(
    @Inject('EventsRepository') private readonly eventsRepository: EventsRepository,
  ) {}

  async getFavEventsByIds(eventIds: number[]): Promise<FavoriteEventResponseData[]> {
    if (!eventIds.length) return [];

    const rawEvents = await this.eventsRepository.findManyByIdsWithDetails(eventIds);

    return rawEvents.map((event: Events) => {
      return {
        id: event.id,
        title: event.title,
        description: event.description,
        imageUrl: event.imgPosterUrl,
      } as FavoriteEventResponseData;
    });
  }
}
