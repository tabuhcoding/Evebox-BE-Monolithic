import { BaseRepository } from 'src/shared/repo/base.repository';
import { Result } from 'oxide.ts';
import { CreateEventDto } from '../../modules/event/commands/createEvent/createEvent.dto';
import { UpdateEventDto } from '../../modules/event/commands/updateEvent/updateEvent.dto';
import { Prisma } from '@prisma/client';
import { UpdateEventAdminDto } from '../../modules/event/commands/UpdateEventAdmin/updateEventAdmin.dto';
import { EventOrgFrontDisplayDto } from '../../modules/event/queries/getEventOfOrg/getEventOfOrg-response.dto';
import { EventOrgDetailResponseDto } from '../../modules/event/queries/getEventOfOrgDetail/getEventOfOrgDetail-response.dto';
import { EventRevenueData, OrganizerRevenueData } from '../../modules/statistics/queries/getOrgRevenue/getOrgRevenue-response.dto';

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

export type EventWithShowingsAndTicketTypes = Prisma.EventsGetPayload<{
  select: {
    id: true;
    title: true;
    Showing: {
      select: {
        id: true;
        startTime: true;
        endTime: true;
        TicketType: {
          select: {
            id: true;
            name: true;
            price: true;
          };
        };
      };
    };
  };
}>;



export interface EventsRepository extends BaseRepository<Events, Prisma.EventsDelegate> {
  // Thêm các method riêng cho Events nếu cần, ví dụ:
  findManyByIdsWithDetails(ids: number[]): Promise<Events[]>;
  updateEventFields(dto: UpdateEventAdminDto, eventId: number): Promise<any | null>;
  /* Create Event */
  createEvent(data: CreateEventDto, email: string, locationId?: number): Promise<number>;

  /* Update Event */
  updateEvent(dto: UpdateEventDto, eventId: number, locationId?: number): Promise<[number, boolean]> ;
  getEventOrganizer(eventId: number): Promise<string | null>;
  getMember(eventId: number, userEmail: string): Promise<any | null>;
  hasPermissionToManageEvent(eventId: number, userEmail: string, permission: string): Promise<Result<boolean, Error>>;

  /* Delete Event */
  deleteEvent(id: number): Promise<number>;

  /* Get admin events */
  findWithFilters(filters: any): Promise<Result<any[], Error>>
  getShowingsByEventId(eventId: number): Promise<{ startTime: Date }[]>
  getSpecialEventsWithFilters(filters: any): Promise<any[]>;
  countSpecialEvents(filters: any): Promise<number>;

  getEventOfOrg(email: string): Promise<Result<(EventOrgFrontDisplayDto & { role: number })[], Error>>;
  getEventOfOrgDetail(eventId: number): Promise<Result<EventOrgDetailResponseDto, Error>>;
  findEventsByOrganizerEmail(email: string): Promise<Pick<Events, 'locationId' | 'venue'>[]>;
  getRevenueEventsWithShowings(
    from?: Date,
    to?: Date,
    search?: string
  ): Promise<{
    id: number;
    title: string;
    description: string;
    organizerId: string;
    orgName: string;
    isApproved: boolean;
    deleteAt: Date | null;
    Showing: {
      id: string;
      startTime: Date;
      endTime: Date;
      TicketType: {
        id: string;
        name: string;
        price: number;
      }[];
    }[];
  }[]>;

  findEventsByOrgIdWithShowings(orgId: string): Promise<EventWithShowingsAndTicketTypes[]>;
  findEventById(eventId: number): Promise<{ id: number; title: string } | null>;
}
