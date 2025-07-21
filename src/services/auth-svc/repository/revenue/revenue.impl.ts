import { Prisma } from 'prisma/client-auth';
import { BaseAuthRepository } from './../base.repository';
import { Injectable } from "@nestjs/common";
import { Revenue, RevenueRepository } from './revenue.repo';
import { PrismaAuthService } from '../../database/prisma-auth/prisma.service';
import { endOfDay, startOfDay } from 'date-fns';
import { AppRevenueData, EventRevenueData } from 'src/services/event-svc/modules/statistics/queries/getOrgRevenue/getOrgRevenue-response.dto';

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

}