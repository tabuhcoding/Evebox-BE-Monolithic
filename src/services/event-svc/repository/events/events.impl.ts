/* Package System */
import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { Prisma } from 'prisma/client-event';
import { Result, Ok, Err } from 'oxide.ts';
import { subMonths, startOfMonth } from 'date-fns';

/* Package Application */
// Repositories
import { BaseEventRepository } from '../base.repository';
import { Events, EventsRepository } from './events.repo';
import { ShowingRepository } from '../showing/showing.repo';
import { ShowingWithEventRepository } from '../showing/showingWithEvent.repo';
import { EventUserRelationshipRepository } from '../eventUserRelationship/eventUserRelationship.repo';
import { UserClickHistoryRepository } from '../userClickHistory/userClickHistory.repo';

// Services
import { PrismaEventService } from '../../database/prisma-event/prisma.service';
import { GetUserService } from 'src/services/auth-svc/modules/user/queries/get-user/get-user.service';
import { GetPaidOrdersByShowingIdService } from 'src/services/booking-svc/modules/queries/getPaidOrdersByShowingId/getPaidOrdersByShowingId.service';
import { GetOrdersInShowingIdsService } from 'src/services/booking-svc/modules/queries/getOrdersInShowingIds/getOrdersInShowingIds.service';

// Data
import { CreateEventDto } from '../../modules/event/commands/createEvent/createEvent.dto';
import { UpdateEventDto } from '../../modules/event/commands/updateEvent/updateEvent.dto';
import { UpdateEventAdminDto } from '../../modules/event/commands/UpdateEventAdmin/updateEventAdmin.dto';
import { EventOrgFrontDisplayDto } from '../../modules/event/queries/getEventOfOrg/getEventOfOrg-response.dto';
import { EventOrgDetailResponseDto } from '../../modules/event/queries/getEventOfOrgDetail/getEventOfOrgDetail-response.dto';
import { EventSummaryData } from '../../modules/event/queries/getEventSummary/getEventSummary-response.dto';
import { EventRevenueData, OrganizerRevenueData, ShowingRevenueData } from '../../modules/statistics/queries/getOrgRevenue/getOrgRevenue-response.dto';
import { PaginationQuery, Pagination } from 'src/shared/constants/pagination';
import { EventWithShowings } from '../../modules/statistics/queries/getOrgRevenue/getOrgRevenue-response.dto';
import { RevenueSummaryItem } from '../../modules/statistics/queries/getOrgRevenueChart/getOrgRevenueChart-response.dto';
import { Ticket } from 'src/services/booking-svc/repository/ticket/ticket.repo';

@Injectable()
export class EventsRepositoryImpl
  extends BaseEventRepository<Events, Prisma.EventsDelegate>
  implements EventsRepository {
  constructor(
    @Inject(forwardRef(() => 'EventUserRelationshipRepository'))
    private readonly eventUserRelaRepo: EventUserRelationshipRepository,
    @Inject('ShowingRepository') private readonly showingRepository: ShowingRepository,
    @Inject('ShowingWithEventRepository') private readonly showingWithEventRepository: ShowingWithEventRepository,
    @Inject('UserClickHistoryRepository') private readonly userClickHistoryRepository: UserClickHistoryRepository,
    protected readonly prisma: PrismaEventService,
    private readonly getUserService: GetUserService,
    private readonly getPaidOrdersByShowingIdService: GetPaidOrdersByShowingIdService,
    private readonly getOrdersInShowingIdsService: GetOrdersInShowingIdsService
  ) {
    super(prisma.events, prisma);
  }

  async findManyByIdsWithDetails(ids: number[]): Promise<Events[]> {
    return this.prisma.events.findMany({
      where: {
        id: { in: ids },
        deleteAt: null,
        isApproved: true,
      },
      include: {
        locations: {
          include: {
            districts: {
              include: {
                province: true,
              },
            },
          },
        },
        EventCategories: {
          include: {
            Categories: true,
          },
        },
        Showing: {
          include: {
            TicketType: true,
          },
        },
      },
    });
  }

  /* Create Event */
  async createEvent(dto: CreateEventDto, email: string, locationId?: number): Promise<number> {
    try {
      const result = await this.prisma.events.create({
        data: {
          title: dto.title,
          description: dto.description,
          isOnline: dto.isOnline ? true : false,
          locationId: locationId >> 0 || null,
          organizerId: email,
          venue: dto.venue,
          imgLogoUrl: dto.imgLogoUrl,
          imgPosterUrl: dto.imgPosterUrl,
          createdAt: new Date(),
          orgDescription: dto.orgDescription,
          orgName: dto.orgName,
          isOnlyOnEve: false,
          isSpecial: false,
          lastScore: 0,
          totalClicks: 0,
          weekClicks: 0,
          isApproved: false
        }
      });

      if (!result) {
        throw new Error('Failed to create event');
      }

      const eventUserRelationship = await this.prisma.eventUserRelationship.create({
        data: {
          eventId: result.id,
          userId: email,
          email: email,
          role: 2, // Assuming 2 is the role for organizer
          role_desc: 'organizer',
        },
      });

      if (!eventUserRelationship) {
        throw new Error('Failed to create event user relationship');
      }

      return result.id as number;
    } catch (error) {
      throw new Error(`Failed to create event: ${error.message}`);
    }
  }

  /* Update Event */
  async updateEvent(dto: UpdateEventDto, eventId: number, isValid: boolean, locationId?: number): Promise<[number, boolean]> {
    try {
      const event = await this.findOneById(eventId);
      if (!event) {
        throw new Error('Event not found');
      }

      const updateData: any = {};
      updateData.isApproved = isValid
      if (dto.title) updateData.title = dto.title;
      if (dto.description) updateData.description = dto.description;
      if (dto.imgLogoUrl) updateData.imgLogoUrl = dto.imgLogoUrl;
      if (dto.imgPosterUrl) updateData.imgPosterUrl = dto.imgPosterUrl;
      if (dto.orgName) updateData.orgName = dto.orgName;
      if (dto.orgDescription) updateData.orgDescription = dto.orgDescription;
      if (dto.isOnline !== undefined) {
        if (updateData.isOnline) {
          updateData.locationId = null;
          updateData.venue = "";
        } else {
          updateData.locationId = locationId;
          updateData.venue = dto.venue;
        }
      }

      updateData.updatedAt = new Date();

      const updatedEvent = await this.updateAndFindOneById(eventId, updateData);
      if (!updatedEvent) {
        throw new Error('Failed to update event');
      }

      return [updatedEvent.id, updatedEvent.isApproved];
    } catch (error) {
      throw new Error(`Failed to find user: ${error.message}`);
    }
  }

  async getEventOrganizer(eventId: number): Promise<string | null> {
    try {
      const event = await this.prisma.events.findUnique({
        where: { id: eventId },
        select: { organizerId: true },
      });

      if (!event) {
        throw new Error('Event not found');
      }

      return event.organizerId;
    } catch (error) {
      throw new Error(`Failed to get event organizer: ${error.message}`);
    }
  }

  async getMember(eventId: number, userEmail: string): Promise<any | null> {
    try {
      const member = await this.prisma.eventUserRelationship.findUnique({
        where: {
          eventId_userId: {
            eventId,
            userId: userEmail,
          },
        },
      });

      return member;
    } catch (error) {
      throw new Error(`Failed to get member: ${error.message}`);
    }
  }

  async hasPermissionToManageEvent(eventId: number, userEmail: string, permission: string): Promise<Result<boolean, Error>> {
    try {
      const event = await this.findOneById(eventId);
      if (!event) {
        throw new Error(`Event with ID ${eventId} not found`);
      }

      if (event?.organizerId === userEmail) {
        return Ok(true);
      }

      const member = await this.getMember(eventId, userEmail);
      if (!member || member.isDeleted) {
        return Ok(false);
      }

      const role = await this.prisma.eventRole.findUnique({
        where: { id: member.role },
      });
      if (!role) {
        return Ok(false);
      }

      return Ok(role[permission] === true);
    } catch (error) {
      throw new Error(`Failed to check permission: ${error.message}`);
    }
  }

  async deleteEvent(id: number): Promise<number> {
    try {
      const event = await this.findOneById(id);

      if (event && event.deleteAt === null) {
        await this.updateOneById(id, {
          deleteAt: new Date(),
        });

        return event.id;
      }

      throw new Error('Event not found or could not be deleted');
    } catch (error) {
      throw new Error(`Failed to check permission: ${error.message}`);
    }
  }

  async updateEventFields(dto: UpdateEventAdminDto, eventId: number): Promise<any | null> {
    const updateData: any = {};
    if (dto.isSpecial) updateData.isSpecial = dto.isSpecial;
    if (dto.isOnlyOnEve) updateData.isOnlyOnEve = dto.isOnlyOnEve;
    if (dto.isApproved) {
      updateData.isApproved = Boolean(dto.isApproved);
    }
    else updateData.isApproved = false;

    try {
      return await this.prisma.events.update({
        where: { id: eventId },
        data: updateData,
      });
    } catch (error) {
      console.error("Prisma update error:", error);

      return null;
    }
  }

  async findWithFilters(filters: any): Promise<Result<any[], Error>> {
    try {
      const where = this.buildWhereClause(filters);
      const page = Number(filters.page ?? 1);
      const limit = Number(filters.limit ?? 10);

      const data = await this.prisma.events.findMany({
        where: {
          ...where,
          ...(filters.categoryId && {
            EventCategories: {
              some: { categoryId: Number(filters.categoryId) }
            }
          })
        },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          title: true,
          venue: true,
          imgLogoUrl: true,
          imgPosterUrl: true,
          deleteAt: true,
          locations: {
            select: {
              street: true,
              ward: true,
              districts: {
                select: {
                  name: true,
                  province: { select: { name: true } }
                }
              }
            }
          },
          isApproved: true,
          createdAt: true,
          isSpecial: true,
          isOnlyOnEve: true,
          isOnline: true,
        },
        orderBy: { createdAt: 'desc' }
      });

      return Ok(data); // ✅ wrap in Ok
    } catch (error) {
      return Err(new Error('Failed to fetch events')); // ✅ return error clearly
    }
  }

  async getShowingsByEventId(eventId: number): Promise<{ startTime: Date }[]> {
    return this.prisma.showing.findMany({
      where: { eventId },
      select: { startTime: true },
    });
  }

  private buildWhereClause(filters: any): any {
    const where: any = {};
    if ('isApproved' in filters) where.isApproved = filters.isApproved === 'true';
    if ('isDeleted' in filters) where.deleteAt = filters.isDeleted === 'true' ? { not: null } : null;
    if ('createdFrom' in filters) where.createdAt = { ...where.createdAt, gte: new Date(filters.createdFrom) };
    if ('createdTo' in filters) where.createdAt = { ...where.createdAt, lte: new Date(filters.createdTo) };
    return where;
  }
  async getSpecialEventsWithFilters(filters: any): Promise<any[]> {
    const where = this.buildWhereClause2(filters);
    const page = Number(filters.page ?? 1);
    const limit = Number(filters.limit ?? 10);

    return this.prisma.events.findMany({
      where: {
        ...where,
        ...(filters.categoryId && {
          EventCategories: {
            some: {
              categoryId: Number(filters.categoryId),
              isSpecial: true,
            },
          },
        }),
      },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        title: true,
        imgPosterUrl: true,
        isSpecial: true,
        isOnlyOnEve: true,
        EventCategories: {
          select: {
            isSpecial: true,
            Categories: {
              select: { id: true, name: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async countSpecialEvents(filters: any): Promise<number> {
    const where = this.buildWhereClause2(filters);
    return this.prisma.events.count({ where });
  }

  private buildWhereClause2(filters: any) {
    const where: any = {};

    if (filters.isSpecial !== undefined) {
      where.isSpecial = filters.isSpecial === 'true';
    }
    if (filters.isOnlyOnEve !== undefined) {
      where.isOnlyOnEve = filters.isOnlyOnEve === 'true';
    }
    if (filters.search) {
      const keyword = filters.search.trim();
      if (!isNaN(Number(keyword))) {
        where.OR = [
          { id: Number(keyword) },
          { title: { contains: keyword, mode: 'insensitive' } },
        ];
      } else {
        where.title = { contains: keyword, mode: 'insensitive' };
      }
    }

    return where;
  }

  async getEventOfOrg(email: string): Promise<Result<(EventOrgFrontDisplayDto & { role: number; })[], Error>> {
    try {
      const user = await this.getUserService.execute(email);

      if (user.isErr()) {
        return Err(new Error(user.unwrapErr().message));
      }

      const userId = user.unwrap().id;

      // 1. Get events where user is the ORGANIZER (role = 2)
      const organizerEvents = await this.findMany({
        organizerId: email,
        deleteAt: null,
      });

      // 2. Get events from UserEventRelationship
      const relatedEvents = await this.eventUserRelaRepo.findMany({
        userId
      });

      const results: (EventOrgFrontDisplayDto & { role: number })[] = [];

      // Add organizer events
      for (const event of organizerEvents) {
        const showings = await this.showingRepository.findMany({
          eventId: event.id,
        });

        const { street, ward, districts } = event.locations ?? {};
        const districtName = districts?.name || '';
        const provinceName = districts?.province?.name || '';
        const locationsString = `${street || ''}, ${ward || ''}, ${districtName}, ${provinceName}`;
        const startTime = await this.caculateEventsStartDate(showings);

        results.push({
          ...event,
          startDate: startTime,
          locationString: locationsString,
          role: 2, // Organizer role
        });
      }

      // Add related events (from user-event relationships)
      for (const rel of relatedEvents) {
        const eventId = rel.eventId;

        const event = await this.findOneById(Number(eventId));

        if (results.some(e => e.id === event.id)) continue;

        const showings = await this.showingRepository.findMany({
          eventId,
        });

        const { street, ward, districts } = event.locations ?? {};
        const districtName = districts?.name || '';
        const provinceName = districts?.province?.name || '';
        const locationsArray = [street, ward, districtName, provinceName].filter(Boolean);

        const locationsString = locationsArray.join(', ');
        const startTime = await this.caculateEventsStartDate(showings);

        results.push({
          ...event,
          startDate: startTime,
          locationString: locationsString,
          role: rel.role, // Other role
        });
      }

      return Ok(results);
    } catch (error) {
      return Err(new Error('Failed to retrieve events of org'));
    }
  }

  async caculateEventsStartDate(showings: any[]) {
    let startTime = new Date("9999-12-31T23:59:59.999Z");
    const nowDate = new Date();
    for (const showing of showings) {
      if (new Date(showing.startTime) > nowDate && new Date(showing.startTime) < startTime) {
        startTime = new Date(showing.startTime);
        continue;
      }
      if (new Date(showing.startTime) < startTime) {
        startTime = new Date(showing.startTime);
      }
    }
    return startTime;
  }

  async getEventOfOrgDetail(eventId: number): Promise<Result<EventOrgDetailResponseDto, Error>> {
    try {
      const event = await this.prisma.events.findUnique({
        where: {
          id: Number(eventId),
        },
        select: {
          id: true,
          title: true,
          description: true,
          imgLogoUrl: true,
          imgPosterUrl: true,
          createdAt: true,
          isOnline: true,
          locations: {
            select: {
              id: true,
              street: true,
              ward: true,
              districts: {
                select: {
                  id: true,
                  name: true,
                  province: {
                    select: {
                      id: true,
                      name: true
                    }
                  }
                }
              }
            }
          },
          venue: true,
          isApproved: true,
          orgDescription: true,
          orgName: true,
          deleteAt: true,
          EventCategories: {
            select: {
              Categories: {
                select: {
                  id: true,
                  name: true
                }
              }
            }
          },
          Showing: {
            select: {
              id: true,
              isFree: true,
              startTime: true,
              endTime: true,
            }
          }
        }
      });

      if (!event) {
        return Err(new Error('No event found'));
      }

      if (event.deleteAt !== null) {
        return Err(new Error(`Event ${eventId} has been deleted`));
      }

      const { street, ward, districts } = event.locations ?? {};
      const districtName = districts?.name || '';
      const provinceName = districts?.province?.name || '';
      const locationsArray = [street, ward, districtName, provinceName].filter(Boolean);

      const locationsString = locationsArray.join(', ');
      const eventDetail: EventOrgDetailResponseDto = {
        ...event,
        locationsString,
        EventCategories: event.EventCategories.map(category => ({
          id: category.Categories.id,
          name: category.Categories.name
        }))
      };
      return Ok(eventDetail);
    } catch (error) {
      return Err(new Error('Failed to retrieve detail of event of org'));
    }
  }

  async getEventSummary(showingId: string): Promise<Result<EventSummaryData, Error>> {
    try {
      const showing = await this.showingWithEventRepository.findOneById(showingId, {
        Events: {
          select: {
            id: true,
            title: true,
          }
        },
        TicketType: true
      });

      const ticketTypeData = showing?.TicketType?.map(tt => ({
        ticketTypeId: tt.id,
        typeName: tt.name,
        price: tt.price,
        originalPrice: tt.originalPrice,
        showingId: tt.showingId,
        quantity: tt.quantity || 0,
      }));

      if (!ticketTypeData) {
        return Err(new Error('Showing has no ticket type data'));
      }

      const orders = await this.getPaidOrdersByShowingIdService.execute(showingId);

      if (orders.isErr()) {
        return Err(new Error('Failed to get paid orders of showing'));
      }

      const paidOrders = orders.unwrap();

      const ticketMapByTicketType = new Map<string, Ticket[]>();
      await Promise.all(
        paidOrders.map(async (order) => {
          const tickets = order.Ticket || [];
          await Promise.all(
            tickets.map(async (ticket) => {
              if (!ticketMapByTicketType.has(ticket.ticketTypeId)) {
                ticketMapByTicketType.set(ticket.ticketTypeId, []);
              }
              ticketMapByTicketType.get(ticket.ticketTypeId)?.push({
                ...ticket,
                Order: null,
              });
            })
          );
        })
      );

      const summary = ticketTypeData.map(tt => {
        const matchedTickets = ticketMapByTicketType.get(tt.ticketTypeId) || [];

        const sold = matchedTickets.length;

        const revenue = matchedTickets.length * tt.price;
        return {
          typeName: tt.typeName,
          price: tt.price,
          originalPrice: tt.originalPrice,
          sold,
          ratio: tt.quantity ? sold / tt.quantity : 0,
          revenue,
          quantity: tt.quantity,
        };
      });

      const totalRevenue = summary.reduce((sum, s) => sum + s.revenue, 0);
      const ticketsSold = summary.reduce((sum, s) => sum + s.sold, 0);
      const totalTickets = ticketTypeData.reduce((sum, tt) => sum + tt.quantity, 0);

      return Ok({
        eventId: showing.eventId,
        eventTitle: showing.Events.title,
        showingId,
        startTime: showing.startTime,
        endTime: showing.endTime,
        totalRevenue,
        ticketsSold,
        totalTickets,
        percentageSold: totalTickets ? ticketsSold / totalTickets : 0,
        byTicketType: summary.map(({ revenue, ...rest }) => rest)
      });
    } catch (error) {
      return Err(new Error('Failed to get summary of event'));
    }
  }

  async countTotalClicksByEvent(eventId: number, startDate?: string, endDate?: string): Promise<Result<number, Error>> {
    try {
      const whereCond: any = { eventId };

      if (startDate || endDate) {
        whereCond.date = {};

        if (startDate) whereCond.date.gte = new Date(startDate);
        if (endDate) whereCond.date.lte = new Date(endDate);
      }

      const totalClicks = await this.userClickHistoryRepository.findMany({ whereCond });

      return Ok(totalClicks?.length || 0);
    } catch (error) {
      return Err(new Error('Failed to count total clicks by event'));
    }
  }

  async countUniqueUsersByEvent(eventId: number, startDate?: Date, endDate?: Date): Promise<Result<number, Error>> {
    try {
      const clicks = await this.userClickHistoryRepository.findMany({
        eventId,
        date: {
          gte: startDate,
          lte: endDate,
        }
      });

      const uniqueUserIds = new Set(clicks.map(click => click.userId));

      return Ok(uniqueUserIds?.size || 0);
    } catch (error) {
      return Err(new Error('Failed to count unique users by event'));
    }
  }

  async countOrdersByEvent(eventId: number): Promise<Result<number, Error>> {
    try {
      const showings = await this.showingRepository.findMany({
        eventId
      });

      const showingIds = showings.map(s => s.id);

      if (showingIds.length > 0) {
        const result = await this.getOrdersInShowingIdsService.execute(showingIds);

        if (result.isErr()) {
          return Err(new Error('Error when get orders in showing ids'));
        }

        const totalOrders = result.unwrap();
        if (!totalOrders) {
          return Err(new Error('Failed to get orders in showing ids'));
        }

        return Ok(totalOrders?.length || 0);
      }

      return Ok(0);
    } catch (error) {
      return Err(new Error('Failed to count orders by event'));
    }
  }

  async countBuyersByEvent(eventId: number): Promise<Result<number, Error>> {
    try {
      const showings = await this.showingRepository.findMany({
        eventId
      });

      const showingIds = showings.map((s) => s.id);

      if (showingIds.length > 0) {
        const result = await this.getOrdersInShowingIdsService.execute(showingIds);

        if (result.isErr()) {
          return Err(new Error('Error when get orders in showing ids'));
        }

        const orders = result.unwrap();
        if (!orders) {
          return Err(new Error('Failed to get orders in showing ids'));
        }

        const uniqueUserIds = new Set(orders.map((order) => order.userId));

        return Ok(uniqueUserIds?.size || 0);
      }

      return Ok(0);
    } catch (error) {
      return Err(new Error('Failed to count buyers by event'));
    }
  }

  async getStatistics(eventId: number): Promise<Result<any, Error>> {
    try {
      const now = new Date();
      const sixMonthsAgo = subMonths(now, 5);
      const clicks = await this.userClickHistoryRepository.findMany({
        eventId,
        date: {
          gte: startOfMonth(sixMonthsAgo), // from start of 6 months ago
          lte: now,
        },
      });

      const statisticsMap = new Map<string, number>();

      for (let i = 0; i < 6; i++) {
        const month = subMonths(now, i);
        const monthKey = `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, '0')}`;
        statisticsMap.set(monthKey, 0);
      }

      for (const click of clicks) {
        const monthKey = `${click.date.getFullYear()}-${String(click.date.getMonth() + 1).padStart(2, '0')}`;
        if (statisticsMap.has(monthKey)) {
          statisticsMap.set(monthKey, (statisticsMap.get(monthKey) || 0) + 1);
        }
      }

      const statistic = Array.from(statisticsMap.entries())
        .map(([month, visits]) => ({ month, visits }))
        .sort((a, b) => a.month.localeCompare(b.month));

      return Ok(statistic);
    } catch (error) {
      return Err(new Error('Failed to get statistics of event'));
    }
  }

  async findEventsByOrganizerEmail(email: string) {
    return this.prisma.events.findMany({
      where: { organizerId: email },
      select: {
        locationId: true,
        venue: true,
      },
    });
  }

  async getRevenueEventsWithShowings(paginationQuery: PaginationQuery, from?: Date, to?: Date, search?: string): Promise<[EventWithShowings[], Pagination]> {
    const where: any = {
      isApproved: true,
      deleteAt: null,
    };

    if (search) {
      where.orgName = {
        contains: search,
        mode: 'insensitive',
      };
    }

    const totalItems = await this.prisma.events.count({ where });

    // Pagination
    const page = paginationQuery?.page ?? 1;
    const limit = paginationQuery?.limit ?? 10;
    const skip = (page - 1) * limit;
    const totalPages = Math.ceil(totalItems / limit);

    const events = await this.prisma.events.findMany({
      where,
      include: {
        Showing: {
          where: {
            ...(from && { startTime: { gte: from } }),
            ...(to && { startTime: { lte: to } }),
            deleteAt: null,
          },
          select: {
            id: true,
            startTime: true,
            endTime: true,
            TicketType: {
              select: {
                id: true,
                name: true,
                price: true,
              }
            }
          }
        }
      },
      skip,
      take: limit,
      orderBy: { id: 'desc' } // hoặc sort theo nhu cầu
    });

    return [
      events,
      { page, limit, totalItems, totalPages }
    ];
  }

  async findEventsByOrgIdWithShowings(orgId: string) {
    return this.prisma.events.findMany({
      where: {
        organizerId: orgId,
        isApproved: true,
        deleteAt: null,
      },
      select: {
        id: true,
        title: true,
        Showing: {
          where: { deleteAt: null },
          select: {
            id: true,
            startTime: true,
            endTime: true,
            TicketType: {
              select: {
                id: true,
                name: true,
                price: true,
              },
            },
          },
        },
      },
    });
  }
  async findEventById(eventId: number) {
    return this.prisma.events.findUnique({
      where: { id: eventId },
      select: { id: true, title: true },
    });
  }

  async isEventOwner(email: string, eventId: number): Promise<Result<boolean, Error>> {
    try {
      const event = await this.prisma.events.findUnique({
        where: { id: eventId },
        select: { organizerId: true },
      });

      if (!event) return Ok(false);
      return Ok(event.organizerId === email);
    } catch {
      return Err(new Error('Failed to check event author'));
    }
  }

  async findRevenueSummary(groupByFormat: string, feePercent: number, fromDate?: Date, toDate?: Date): Promise<Result<RevenueSummaryItem[], Error>> {
    const rawQuery = `
      SELECT
        to_char(s."startTime", '${groupByFormat}') AS period,
        SUM(t.price) AS "totalRevenue"
      FROM "Showing" s
      JOIN "Ticket" t ON t."showingId" = s.id
      WHERE t."paymentId" IS NOT NULL
        AND s."deleteAt" IS NULL
        ${fromDate ? `AND s."startTime" >= '${fromDate.toISOString()}'` : ""}
        ${toDate ? `AND s."startTime" <= '${toDate.toISOString()}'` : ""}
      GROUP BY period
      ORDER BY period
    `;

    const result = await this.prisma.$queryRawUnsafe<RevenueSummaryItem[]>(rawQuery);

    if (!result || result.length === 0) {
      return Ok([]);
    }

    const mappedResult = result.map((row: any) => ({
      period: row.period,
      totalRevenue: Number(row.totalRevenue),
      actualRevenue: Number(row.totalRevenue) * (1 - feePercent / 100),
    }));

    return Ok(mappedResult);
  }
}
