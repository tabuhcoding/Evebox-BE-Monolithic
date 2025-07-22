import { Prisma } from 'prisma/client-auth';
import { BaseAuthRepository } from './../base.repository';
import { Injectable } from "@nestjs/common";
import { Revenue, RevenueRepository } from './revenue.repo';
import { PrismaAuthService } from '../../database/prisma-auth/prisma.service';
import { endOfDay, startOfDay } from 'date-fns';
import { AppRevenueData, EventRevenueData, OrganizerRevenueData, TicketTypeRevenueData } from 'src/services/event-svc/modules/statistics/queries/getOrgRevenue/getOrgRevenue-response.dto';
import { Pagination, PaginationQuery } from 'src/shared/constants/pagination';
import { OrganizerRevenue } from '../organizer-revenue/organizer-revenue.repo';
import { convertToEventRevenueData } from 'src/services/event-svc/modules/statistics/queries/getOrgRevenue/getOrgRevenue.service';
import { TicketTypeRevenue } from '../tickettype-revenue/tickettype-revenue.repo';
import { RevenueByTicketPriceData } from 'src/services/event-svc/modules/statistics/queries/getRevenueByTicketPrice/getRevenueByTicketPrice-response.dto';
import { ProvinceRevenueData } from 'src/services/event-svc/modules/statistics/queries/getOrgRevenueByProvince/getOrgRevenueByProvince-response.dto';

@Injectable()
export class RevenueRepositoryImpl
  extends BaseAuthRepository<Revenue, Prisma.RevenueDelegate>
  implements RevenueRepository 
{
  constructor(
    protected readonly prisma: PrismaAuthService,
  ) {
    super(prisma.revenue, prisma);
  }

  async totalRevenue(from?: string, to?: string): Promise<AppRevenueData> {
    const query: any = {};
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

    const totalRevenueData = await this.prisma.revenue.aggregate({
      where: query,
      _sum: {
        total_revenue: true,
      },
    });

    // Bước 2: Lấy danh sách OrganizeRevenue, group theo org_id và tính tổng + count
    const organizeRevenueGrouped = await this.prisma.organizeRevenue.groupBy({
      by: ["org_id"],
      where: {
        Revenue: query,
      },
      _sum: {
        total_revenue: true,
      },
      // _count: {
      //   _all: true,
      // },
    });

    // Kết quả
    const result = {
      platformFeePercent: 10,
      actualRevenue: totalRevenueData._sum.total_revenue ? totalRevenueData._sum.total_revenue * 0.1 : 0,
      totalRevenue: totalRevenueData._sum.total_revenue ?? 0,
      organizers: organizeRevenueGrouped.map((item) => ({
        orgId: item.org_id,
        organizerName: item.org_id,
        totalRevenue: item._sum.total_revenue ?? 0,
        actualRevenue: item._sum.total_revenue ? item._sum.total_revenue * 0.9 : 0,
        platformFeePercent: 10,
        events: [],
        // count: item._count._all,
      })),
    };

    return result;
  }

  async totalRevenueV2(from?: string, to?: string): Promise<AppRevenueData> {
  const query: any = {};
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

  const totalRevenueData = await this.prisma.revenue.aggregate({
    where: query,
    _sum: {
      total_revenue: true,
    },
  });

  // Step 1: Lấy organizeRevenue group theo org_id
  const organizeRevenueGrouped = await this.prisma.organizeRevenue.groupBy({
    by: ["org_id"],
    where: {
      Revenue: query,
    },
    _sum: {
      total_revenue: true,
    },
  });

  // Step 2: Lấy mapping: organizeRevenue.id => org_id
  const allOrganizerRecords = await this.prisma.organizeRevenue.findMany({
    where: {
      Revenue: query,
    },
    select: {
      id: true,
      org_id: true,
    },
  });

  const idToOrgId = Object.fromEntries(
    allOrganizerRecords.map((item) => [item.id, item.org_id])
  );

  // Step 3: groupBy EventRevenue theo org_id (int) + event_id
  const eventRevenueGrouped = await this.prisma.eventRevenue.groupBy({
    by: ["org_id", "event_id", "event_name"],
    where: {
      date: query.date,
    },
    _sum: {
      total_revenue: true,
    },
  });

  // Step 4: Map eventRevenue thành dạng { org_id_string: { event_id, total }[] }
  const orgEventsMap: Record<
    string,
    EventRevenueData[]
  > = {};

  for (const item of eventRevenueGrouped) {
    const orgIdString = idToOrgId[item.org_id];
    if (!orgIdString) continue;
    if (!orgEventsMap[orgIdString]) {
      orgEventsMap[orgIdString] = [];
    }
    orgEventsMap[orgIdString].push({
      eventId: item.event_id,
      eventName: item.event_name,
      totalRevenue: item._sum.total_revenue ?? 0,
      platformFeePercent: 10,
      actualRevenue: item._sum.total_revenue ? item._sum.total_revenue * 0.9 : 0,
      showings: [],
    });
  }

  // Step 5: Trả kết quả đầy đủ
  const result = {
    platformFeePercent: 10,
    actualRevenue: totalRevenueData._sum.total_revenue
      ? totalRevenueData._sum.total_revenue * 0.1
      : 0,
    totalRevenue: totalRevenueData._sum.total_revenue ?? 0,
    organizers: organizeRevenueGrouped.map((item) => {
      const orgId = item.org_id;
      const totalRevenue = item._sum.total_revenue ?? 0;
      return {
        orgId,
        organizerName: orgId,
        totalRevenue,
        actualRevenue: totalRevenue * 0.9,
        platformFeePercent: 10,
        events: orgEventsMap[orgId] ?? [],
      };
    }),
  };

  return result;
  }

  async getListOrganizerRevenue(
    pagination: PaginationQuery,
    from?: string,
    to?: string,
    search?: string,
  ): Promise<[OrganizerRevenueData[],Pagination]> {
    const query: any = {};
    if (from) {
      query.date = {
        gte: startOfDay(new Date(from)),
      };
    }
    if (to) {
      query.date = {
        ...query.date,
        lte: endOfDay(new Date(to)),
      };
    }
    if (search) {
      query.org_id = {
        contains: search,
        mode: 'insensitive',
      };
    }

    const distinctOrgIds = await this.prisma.organizeRevenue.findMany({
      where: query,
      distinct: ["org_id"],
      select: {
        org_id: true,
      },
      orderBy: { org_id: 'asc' },
    });

    const totalItems = distinctOrgIds.length;
    const distictOrgIdsWithPagin = distinctOrgIds.slice(
      (pagination.page - 1) * pagination.limit,
      pagination.page * pagination.limit,
    ).map(item => item.org_id);

    const data = await this.prisma.organizeRevenue.groupBy({
      by: ["org_id"],
      where: {
        ...query,
        org_id: {
          in: distictOrgIdsWithPagin,
        },
      },
      _sum: {
        total_revenue: true,
      },
    });

    const paginationResult: Pagination = {
      page: pagination.page,
      limit: pagination.limit,
      totalItems: totalItems,
      totalPages: Math.ceil(totalItems / pagination.limit),
    };
    const result = data.map(item => ({
      orgId: item.org_id,
      organizerName: item.org_id,
      totalRevenue: item._sum.total_revenue ?? 0,
      actualRevenue: item._sum.total_revenue ? item._sum.total_revenue * 0.9 : 0,
      platformFeePercent: 10,
      events: [],
    }));
    return [result, paginationResult];
  }

  async getListEventRevenue(
    pagination: PaginationQuery,
    from?: string,
    to?: string,
    search?: string,
  ): Promise<[EventRevenueData[], Pagination]> {
    const query: any = {};
    if (from) {
      query.date = {
        gte: startOfDay(new Date(from)),
      };
    }
    if (to) {
      query.date = {
        ...query.date,
        lte: endOfDay(new Date(to)),
      };
    }
    if (search) {
      query.OR = [
        { event_name: { contains: search, mode: 'insensitive' } },
        { event_id: { contains: search, mode: 'insensitive' } },
      ]
    }

    const eventDistinct = await this.prisma.eventRevenue.findMany({
      where: query,
      distinct: ["event_id"],
      select: {
        event_id: true,
      },
      orderBy: { id: 'desc' },
    });

    const totalItems = eventDistinct.length;
    if (pagination.limit <= 0 ){
      pagination.limit = totalItems;
    }
    const eventDistinctWithPagin = eventDistinct.slice(
      (pagination.page - 1) * pagination.limit,
      pagination.page * pagination.limit,
    ).map(item => item.event_id);

    const data = await this.prisma.eventRevenue.findMany({
      where: {
        event_id: {
          in: eventDistinctWithPagin 
        }
      },
      include: {
        ShowingRevenue: {
          include: {
            TicketTypeRevenue: true,
          },
        }
      },
      orderBy: { id: 'desc' },
    });

    const paginationResult: Pagination = {
      page: pagination.page,
      limit: pagination.limit,
      totalItems: totalItems,
      totalPages: Math.ceil(totalItems / pagination.limit),
    };

    const result: EventRevenueData[] = convertToEventRevenueData(data);

    return [result, paginationResult];
  }

  async getListTicketTypeRevenue(ranges: RevenueByTicketPriceData[]): Promise<RevenueByTicketPriceData[]> {
    if (ranges.length === 0) {
      return [];
    }

    for (const range of ranges) {
      const result = await this.prisma.ticketTypeRevenue.aggregate({
        where: {
          price: {
            gte: range.minPrice,
            lte: range.maxPrice,
          },
        },
        _sum: {
          total_revenue: true,
          sold: true,
        },
      });

      range.revenue = result._sum.total_revenue ?? 0;
      range.sold = result._sum.sold ?? 0;
      range.conversionRate = range.total && range.total > 0 ? result._sum.sold / range.total : 0;
    }

    return ranges;
  }

  async appendRevenueToDistrictData(
    districts: (ProvinceRevenueData & { eventIds: number[] })[]
  ): Promise<ProvinceRevenueData[]> {
    for (const district of districts) {
      const revenueData = await this.prisma.eventRevenue.aggregate({
        where: {
          event_id: {
            in: district.eventIds,
          },
        },
        _sum: {
          total_revenue: true,
        },
      });
      const totalRevenue = revenueData._sum.total_revenue ?? 0;
      district.totalRevenue = totalRevenue;
    }

    return districts;
  }
}