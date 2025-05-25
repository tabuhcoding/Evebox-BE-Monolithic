import { BaseRepository } from 'src/shared/repo/base.repository';
import { Result } from 'oxide.ts';
import { CreateEventDto } from '../../modules/event/commands/createEvent/createEvent.dto';
import { UpdateEventDto } from '../../modules/event/commands/updateEvent/updateEvent.dto';
import { Prisma } from '@prisma/client';

export type Events = Prisma.EventsGetPayload<{
  include: {
    locations: {
      include: {
        districts: {
          include: {
            province: true;
          };
        };
      };
    };
    EventCategories: {
      include: {
        Categories: true;
      };
    };
    Showing: {
      include: {
        TicketType: true;
      };
    };
  };
}>;

export type EventsWithoutShowing = Prisma.EventsGetPayload<{
  include: {
    locations: {
      include: {
        districts: {
          include: {
            province: true;
          };
        };
      };
    };
    EventCategories: {
      include: {
        Categories: true;
      };
    };
  };
}>;

export interface EventsRepository extends BaseRepository<Events, Prisma.EventsDelegate> {
  // Thêm các method riêng cho Events nếu cần, ví dụ:
  findManyByIdsWithDetails(ids: number[]): Promise<Events[]>;

  /* Create Event */
  createEvent(data: CreateEventDto, email: string, locationId?: number): Promise<number>;
  createEventCategory(eventId: number, categoryIds: number[]): Promise<Result<any, Error>>
  createLocation(streetString: string, wardString: string, districtId: number): Promise<number>

  /* Update Event */
  updateEvent(dto: UpdateEventDto, eventId: number, email: string, locationId?: number): Promise<number>;
  getEventOrganizer(eventId: number): Promise<string | null>;
  getMember(eventId: number, userEmail: string): Promise<any | null>;
  hasPermissionToUpdateEvent(eventId: number, userEmail: string): Promise<Result<boolean, Error>>;
  updateEventCategory(eventId: number, categoryIds: number[]): Promise<Result<any, Error>>;
}
