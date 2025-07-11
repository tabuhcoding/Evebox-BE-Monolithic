import { BaseEventRepository } from '../base.repository';
import { Result } from 'oxide.ts';
import { CreateEventDto } from '../../modules/event/commands/createEvent/createEvent.dto';
import { UpdateEventDto } from '../../modules/event/commands/updateEvent/updateEvent.dto';
import { Prisma } from 'prisma/client-event';
import { UpdateEventAdminDto } from '../../modules/event/commands/UpdateEventAdmin/updateEventAdmin.dto';
import { EventOrgFrontDisplayDto } from '../../modules/event/queries/getEventOfOrg/getEventOfOrg-response.dto';
import { EventOrgDetailResponseDto } from '../../modules/event/queries/getEventOfOrgDetail/getEventOfOrgDetail-response.dto';
import { EventSummaryData } from '../../modules/event/queries/getEventSummary/getEventSummary-response.dto';
import { EventRevenueData, OrganizerRevenueData } from '../../modules/statistics/queries/getOrgRevenue/getOrgRevenue-response.dto';
import { Pagination, PaginationQuery } from 'src/shared/constants/pagination';
import { EventWithShowings } from '../../modules/statistics/queries/getOrgRevenue/getOrgRevenue-response.dto';
import { RevenueSummaryItem } from '../../modules/statistics/queries/getOrgRevenueChart/getOrgRevenueChart-response.dto';
import { ProvinceRevenueData } from '../../modules/statistics/queries/getOrgRevenueByProvince/getOrgRevenueByProvince-response.dto';

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
    organizerId: true;
    orgName: true;
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

export type EventWithShowingsData = Prisma.EventsGetPayload<{
  select: {
    id: true,
    locations: {
      select: {
        districts: {
          select: {
            province: {
              select: {
                id: true,
                name: true
              },
            },
          },
        },
      },
    },
    Showing: {
      where: {
        deleteAt: null,
      },
      select: {
        id: true,
      }
    };
  }
}>;

export type TicketTypesData = Prisma.TicketTypeGetPayload<{
  select: {
    id: true;
    price: true;
    quantity: true;
  }
}>;

export type TicketTypePriceRange = {
  minPrice: number;
  maxPrice: number;
  ticketTypes: TicketTypesData[];
}

export interface EventsRepository extends BaseEventRepository<Events, Prisma.EventsDelegate> {
  // Thêm các method riêng cho Events nếu cần, ví dụ:
  findManyByIdsWithDetails(ids: number[]): Promise<Events[]>;
  updateEventFields(dto: UpdateEventAdminDto, eventId: number): Promise<any | null>;
  /* Create Event */
  createEvent(data: CreateEventDto, email: string, locationId?: number): Promise<number>;

  /* Update Event */
  updateEvent(dto: UpdateEventDto, eventId: number, isValid: boolean, locationId?: number): Promise<[number, boolean]>;
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

  /* Statistics */
  getEventSummary(showingId: string): Promise<Result<EventSummaryData, Error>>;
  countTotalClicksByEvent(eventId: number, startDate?: string, endDate?: string): Promise<Result<number, Error>>;
  countUniqueUsersByEvent(eventId: number, startDate?: Date, endDate?: Date): Promise<Result<number, Error>>;
  countOrdersByEvent(eventId: number): Promise<Result<number, Error>>;
  countBuyersByEvent(eventId: number): Promise<Result<number, Error>>;
  getStatistics(eventId: number): Promise<Result<any, Error>>;
  findEventsByOrganizerEmail(email: string): Promise<Pick<Events, 'locationId' | 'venue'>[]>;
  getRevenueEventsWithShowings(
    userIds: string[]
  ): Promise<EventWithShowings[]>;

  findEventsByOrgIdWithShowings(orgId: string): Promise<EventWithShowingsAndTicketTypes[]>;
  findRevenueSummary(groupByFormat: string, feePercent: number, fromDate?: Date, toDate?: Date): Promise<Result<RevenueSummaryItem[], Error>>;
  findEventById(eventId: number): Promise<{ id: number; title: string } | null>;
  isEventOwner(email: string, eventId: number): Promise<Result<boolean, Error>>;
  getOrgRevenueByProvince(): Promise<Result<ProvinceRevenueData[], Error>>;
  getAllTicketTypes(): Promise<TicketTypesData[]>;
  getTicketTypePriceRange(): Promise<TicketTypePriceRange[]>;
}
