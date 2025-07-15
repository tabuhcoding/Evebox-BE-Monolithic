import { Pagination, PaginationQuery } from 'src/shared/constants/pagination';
import { Inject, Injectable } from "@nestjs/common";
import { TicketTypeRevenue } from "prisma/client-auth";
import { SlackService } from "src/infrastructure/adapters/slack/slack.service";
import { EventRevenue, EventRevenueRepository } from "src/services/auth-svc/repository/event-revenue/event-revenue.repo";
import { OrganizerRevenue, OrganizerRevenueRepository } from "src/services/auth-svc/repository/organizer-revenue/organizer-revenue.repo";
import { Revenue, RevenueRepository } from "src/services/auth-svc/repository/revenue/revenue.repo";
import { ShowingRevenue, ShowingRevenueRepository } from "src/services/auth-svc/repository/showing-revenue/showing-revenue.repo";
import { TicketTypeRevenueRepository } from "src/services/auth-svc/repository/tickettype-revenue/tickettype-revenue.repo";
import { RevenueDataDTO } from "src/services/booking-svc/modules/commands/calculateRevenue/revenue.dto";

@Injectable()
export class SaveRevenueDataService {
  constructor(
    @Inject('RevenueRepository') private readonly revenueRepository: RevenueRepository,
    @Inject('OrganizerRevenueRepository') private readonly organizerRevenueRepository: OrganizerRevenueRepository,
    @Inject('EventRevenueRepository') private readonly eventRevenueRepository: EventRevenueRepository,
    @Inject('ShowingRevenueRepository') private readonly showingRevenueRepository: ShowingRevenueRepository,
    @Inject('TicketTypeRevenueRepository') private readonly ticketTypeRevenueRepository: TicketTypeRevenueRepository,
    private readonly slackService: SlackService,
  ){}

  async saveRevenueData(data: RevenueDataDTO): Promise<void> {
    try{
      // revenue
      const revenue = await this.revenueRepository.insertOneWithNumberId({
        date: data.date,
        total_revenue: data.total_revenue,
      })

      // organizer revenue
      for (const [_, orgData] of data.organizers.entries()) {
        const org_revenue = await this.organizerRevenueRepository.insertOneWithNumberId({
          revenue_id: revenue,
          org_id: orgData.org_id,
          total_revenue: orgData.total_revenue,
          org_name: orgData.org_name,
        });

        // event revenue
        for (const [_, eventData] of orgData.events.entries()) {
          const event_revenue = await this.eventRevenueRepository.insertOneWithNumberId({
            org_id: org_revenue,
            event_id: eventData.event_id,
            event_name: eventData.event_name,
            total_revenue: eventData.total_revenue,
          });

          // showing revenue
          for (const [_, showingData] of eventData.showings) {
            const showing_revenue = await this.showingRevenueRepository.insertOneWithNumberId({
              event_id: event_revenue,
              showing_id: showingData.showing_id,
              start_date: showingData.start_date,
              end_date: showingData.end_date,
              total_revenue: showingData.total_revenue,
            });

            // ticket type revenue
            for (const [ticketTypeId, ticketTypeData] of showingData.ticket_types.entries()) {
              await this.ticketTypeRevenueRepository.insertOneWithNumberId({
                showing_id: showing_revenue,
                ticket_type_id: ticketTypeId,
                name: ticketTypeData.name,
                price: ticketTypeData.price,
                sold: ticketTypeData.sold,
                total_revenue: ticketTypeData.total_revenue,
              });
            }
          }
        }
      }

      await this.slackService.sendNotice(`Auth Svc >>> SaveRevenueDataService : Revenue data saved successfully for date ${data.date}`);
    }
    catch (error) {
      await this.slackService.sendError(`Auth Svc >>> SaveRevenueDataService : ${error.message}`);
      return;
    }
  }

  async checkDateHasData(date: string): Promise<boolean> {
    const revenue = await this.revenueRepository.findOne({
      date: new Date(date),
    });
    return !!revenue;
  }

  async getRangeData(): Promise<[ Date,Date ]> {
    const revenues = await this.revenueRepository.findMany({});
    if (revenues.length === 0) {
      throw new Error('No revenue data found');
    }
    const dates = revenues.map(revenue => revenue.date.getTime());
    return [
      new Date(Math.min(...dates)),
      new Date(Math.max(...dates))
    ];
  }

  async getAllRevenue(from: Date, to: Date): Promise<Map<Date, number>> {
    const revenues = await this.revenueRepository.findMany({
      date: {
        gte: from,
        lte: to,
      }
    });
    const revenueMap = new Map<Date, number>();
    revenues.forEach(revenue => {
      revenueMap.set(revenue.date, revenue.total_revenue);
    });
    return revenueMap;
  }

  async getRevenueByDate(from?: string, to?: string): Promise<Revenue[]> {
    var query = {}
    if (from) {
      query['date'] = {
        gte: new Date(from),
      };
    }
    if (to) {
      query['date'] = {
        ...query['date'],
        lte: new Date(to),
      };
    }

    const revenues = await this.revenueRepository.findMany(query, {
      OrganizeRevenue: {
        include: {
          EventRevenue: {
            include: {
              ShowingRevenue: {
                include: {
                  TicketTypeRevenue: true,
                },
              },
            },
          },
        },
      },
    });
    if (!revenues || revenues.length === 0) {
      throw new Error(`No revenue data found for date: ${from} to ${to}`);
    }
    return revenues;
  }

  async getRevenueByDateV2(from?: string, to?: string): Promise<Revenue[]> {
    var query = {}
    if (from) {
      query['date'] = {
        gte: new Date(from),
      };
    }
    if (to) {
      query['date'] = {
        ...query['date'],
        lte: new Date(to),
      };
    }

    const revenues = await this.revenueRepository.findMany(query, {
    });
    if (!revenues || revenues.length === 0) {
      throw new Error(`No revenue data found for date: ${from} to ${to}`);
    }
    return revenues;
  }

  async getOrganizerRevenueByDateAndOrgId(pagination: PaginationQuery, from?: string, to?: string, search?: string, org_id?: string[]): Promise<[OrganizerRevenue[], Pagination]> {
    var query = {}
    if (from) {
      query['date'] = {
        gte: new Date(from),
      };
    }
    if (to) {
      query['date'] = {
        ...query['date'],
        lte: new Date(to),
      };
    }
    if (search) {
      query['org_id'] = {
        contains: search,
        mode: 'insensitive',
      };
    }
    if (org_id && org_id.length > 0) {
      query['org_id'] = {
        in: org_id,
      };
    }
    const count = await this.organizerRevenueRepository.countDistinct('org_id', query);
    if (pagination.limit <= 0 ) pagination.limit = count;
    const paginationResult: Pagination = {
      totalItems: count,
      page: pagination.page,
      limit: pagination.limit,
      totalPages: Math.ceil(count / pagination.limit),
    };

    const distinctOrgIds = await this.organizerRevenueRepository.getDistinct(
      'org_id',
      query,
      { org_id: 'asc' },
      (pagination.page - 1) * pagination.limit,
      pagination.limit
    );

    if (!distinctOrgIds || distinctOrgIds.length === 0) {
      return [[], paginationResult];
    }
    query['org_id'] = {
      in: distinctOrgIds.map(org => org.org_id),
    };
      
    const organizerRevenues = await this.organizerRevenueRepository.findMany(query, {
      EventRevenue: {
        include: {
          ShowingRevenue: {
            include: {
              TicketTypeRevenue: true,
            },
          },
        },
      }
    }, { org_id: "asc"});
    if (!organizerRevenues || organizerRevenues.length === 0) {
      throw new Error(`No organizer revenue data found for orgId: ${search} from date: ${from} to ${to}`);
    }
    return [organizerRevenues, paginationResult];
  }

  async getEventRevenueByDateAndEventId(from?: string, to?: string, eventId?: number, search?: string): Promise<EventRevenue[]> {
    var query = {}
    if (from) {
      query['date'] = {
        gte: new Date(from),
      };
    }
    if (to) {
      query['date'] = {
        ...query['date'],
        lte: new Date(to),
      };
    }
    if (eventId) {
      query['event_id'] = eventId;
    }
    if (search) {
      query['event_name'] = {
        contains: search,
        mode: 'insensitive',
      };
    }
    const eventRevenues = await this.eventRevenueRepository.findMany(query, {
      ShowingRevenue: {
        include: {
          TicketTypeRevenue: true,
        },
      },
    });
    if (!eventRevenues || eventRevenues.length === 0) {
      throw new Error(`No event revenue data found for eventId: ${eventId} from date: ${from} to ${to}`);
    }
    return eventRevenues;
  }

  async getShowingRevenueByDateAndShowingId(pagination: PaginationQuery, from?: string, to?: string, showingId?: string): Promise<ShowingRevenue[]> {
    var query = {}
    if (from) {
      query['date'] = {
        gte: new Date(from),
      };
    }
    if (to) {
      query['date'] = {
        ...query['date'],
        lte: new Date(to),
      };
    }
    if (showingId) {
      query['showing_id'] = showingId;
    }
    const showingRevenues = await this.showingRevenueRepository.findMany(query, {
      TicketTypeRevenue: true,
    });
    if (!showingRevenues || showingRevenues.length === 0) {
      throw new Error(`No showing revenue data found for showingId: ${showingId} from date: ${from} to ${to}`);
    }
    return showingRevenues;
  }

  async getTicketTypeRevenueByDateAndTicketTypeId(pagination: PaginationQuery, from?: string, to?: string, ticketTypeId?: string): Promise<TicketTypeRevenue[]> {
    var query = {}
    if (from) {
      query['date'] = {
        gte: new Date(from),
      };
    }
    if (to) {
      query['date'] = {
        ...query['date'],
        lte: new Date(to),
      };
    }
    if (ticketTypeId) {
      query['ticket_type_id'] = ticketTypeId;
    }
    const ticketTypeRevenues = await this.ticketTypeRevenueRepository.findMany(query);
    if (!ticketTypeRevenues || ticketTypeRevenues.length === 0) {
      throw new Error(`No ticket type revenue data found for ticketTypeId: ${ticketTypeId} from date: ${from} to ${to}`);
    }
    return ticketTypeRevenues;
  }
}