import { BaseRepository } from 'src/shared/repo/base.repository';
import { Prisma } from '@prisma/client';
import { UpdateEventAdminDto } from '../../modules/event/commands/calculateShowingStatus/UpdateEventAdmin/updateEventAdmin.dto';

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
    updateEventFields(dto: UpdateEventAdminDto, eventId: number): Promise<any | null>;
}
