import { Inject, Injectable } from "@nestjs/common";
import { Result, Ok, Err } from "oxide.ts";
import { RevenueSummaryItem } from "./getOrgRevenueChart-response.dto";
import { GetAdminAccessService } from "src/services/auth-svc/modules/user/queries/get-admin-access/get-admin-access.service";
import { EventsRepository } from "src/services/event-svc/repository/events/events.repo";
import { SlackService } from "src/infrastructure/adapters/slack/slack.service";
import { startOfWeek, endOfWeek, addWeeks, differenceInCalendarMonths, differenceInCalendarDays, startOfMonth, subMonths, differenceInCalendarWeeks, addDays, startOfDay } from 'date-fns';
import { GetPaidOrdersByShowingIdService } from "src/services/booking-svc/modules/queries/getPaidOrdersByShowingId/getPaidOrdersByShowingId.service";
import { SaveRevenueDataService } from "src/services/auth-svc/modules/admin/commands/saveRevenueData/saveRevenueData.service";

const FEE_PERCENT = 10; // default, or can be got from OrgPaymentInfo table

@Injectable()
export class GetOrgRevenueChartService {
  constructor(
    @Inject('EventsRepository') private readonly eventsRepo: EventsRepository,
    private readonly getAdminAccessService: GetAdminAccessService,
    private readonly slackService: SlackService,
    private readonly getPaidOrdersByShowingIdService: GetPaidOrdersByShowingIdService,
    private readonly saveRevenueDataService: SaveRevenueDataService,
  ) {}

  async execute(email: string, fromDate?: string, toDate?: string, filterType: "month" | "year" = "month"): Promise<Result<RevenueSummaryItem[], Error>> {
    try {
      // const isAdmin = await this.getAdminAccessService.execute(email);
      // if (!isAdmin) {
      //   return Err(new Error('You do not have permission to get organizer revenue'));
      // }

      var from = fromDate ? new Date(fromDate) : undefined;
      var to = toDate ? new Date(toDate) : undefined;

      if (from && to && from > to) {
        return Err(new Error('fromDate must be earlier than or equal to toDate'));
      }

      if (!from || !to) {
        // const today = new Date();
        // if (filterType === 'month') {
        //   from = startOfMonth(subMonths(today, 2));
        //   to = today; // 4 weeks later
        // } else if (filterType === 'year') {
        //   from = new Date(today.getFullYear(), 0, 1); // start of the year
        //   to = new Date(today.getFullYear() + 1, 0, 1); // start of next year
        // } else {
        //   return Err(new Error("Invalid filterType. Must be 'month' or 'year'"));
        // }
        [from, to] = await this.saveRevenueDataService.getRangeData();
      }

      if (filterType && filterType !== 'month' && filterType !== 'year') {
        return Err(new Error("Invalid filterType. Must be 'month' or 'year'"))
      }

      const revenueMapping = await this.saveRevenueDataService.getAllRevenue(from, to);

      const totalTimeStamp =
        filterType === 'month'
          ? differenceInCalendarDays(to, from)
          : differenceInCalendarWeeks(to, from);

      const statisticsMap = new Map<string, RevenueSummaryItem>();

      for (let i = 0; i <= totalTimeStamp; i++) {
        const timeStart =
          filterType === 'month'
            ? startOfDay(addDays(from, i))
            : startOfWeek(addWeeks(from, i), { weekStartsOn: 1 });

        const key =
          filterType === 'month'
            ? timeStart.toISOString().split('T')[0] // YYYY-MM-DD
            : timeStart.toISOString().split('T')[0]; // YYYY-MM-DD (đại diện tuần)

        statisticsMap.set(key, { period: key, totalRevenue: 0, actualRevenue: 0 });
      }

      for (const [date, totalRevenue] of revenueMapping.entries()) {
        const dateObj = new Date(date);

        const timeStart =
          filterType === 'month'
            ? startOfDay(dateObj)
            : startOfWeek(dateObj, { weekStartsOn: 1 });

        const key = timeStart.toISOString().split('T')[0];

        if (statisticsMap.has(key)) {
          const item = statisticsMap.get(key)!;
          item.totalRevenue += totalRevenue;
          item.actualRevenue += totalRevenue * (1 - FEE_PERCENT / 100);
        }
      }

      return Ok(
        Array.from(statisticsMap.values()).sort((a, b) => {
          return new Date(a.period).getTime() - new Date(b.period).getTime();
        })
      );

    } catch (error) {
      this.slackService.sendError(`EventSvc >> GetOrgRevenueChartService: Failed to get org revenue chart: ${error.message}`);
      return Err(new Error('Internal server error'));
    }
  }

  async executeV2(email: string, fromDate?: string, toDate?: string, filterType: "month" | "year" = "month"): Promise<Result<RevenueSummaryItem[], Error>> {
    try {
      const isAdmin = await this.getAdminAccessService.execute(email);
      if (!isAdmin) {
        return Err(new Error('You do not have permission to get organizer revenue'));
      }

      var from = fromDate ? new Date(fromDate) : undefined;
      var to = toDate ? new Date(toDate) : undefined;

      if (from && to && from > to) {
        return Err(new Error('fromDate must be earlier than or equal to toDate'));
      }

      if (!from || !to) {
        const today = new Date();
        if (filterType === 'month') {
          from = startOfMonth(subMonths(today, 2));
          to = today; // 4 weeks later
        } else if (filterType === 'year') {
          from = new Date(today.getFullYear(), 0, 1); // start of the year
          to = new Date(today.getFullYear() + 1, 0, 1); // start of next year
        } else {
          return Err(new Error("Invalid filterType. Must be 'month' or 'year'"));
        }
      }

      if (filterType && filterType !== 'month' && filterType !== 'year') {
        return Err(new Error("Invalid filterType. Must be 'month' or 'year'"))
      }

      const totalTimeStamp = filterType === 'month' ? differenceInCalendarDays(to, from) : differenceInCalendarMonths(to, from);
      const statisticsMap = new Map<string, RevenueSummaryItem>();

      const revenue = await this.saveRevenueDataService.getRevenueByDateV2(
        fromDate?.split('T')[0], 
        toDate?.split('T')[0],
      );

      for (let i = 0; i < totalTimeStamp; i++) {
        const timeStart = filterType === 'month' ? startOfWeek(addWeeks(from, i), { weekStartsOn: 1 }) : startOfMonth(addWeeks(from, i));
        const key = filterType === 'month' ? timeStart.toISOString().split('T')[0] : timeStart.getFullYear().toString();
        statisticsMap.set(key, { period: key, totalRevenue: 0, actualRevenue: 0 });
      }

      await Promise.all(revenue.map(async (order) => {
        const startAt = new Date(order.date);

        const timeStart = filterType === 'month' ? startOfWeek(startAt, { weekStartsOn: 1 }) : startOfMonth(startAt);
        const key = filterType === 'month' ? timeStart.toISOString().split('T')[0] : timeStart.getFullYear().toString();

        if (statisticsMap.has(key)) {
          const item = statisticsMap.get(key)!;
          const totalRevenue = order.total_revenue;
          item.totalRevenue += totalRevenue;
          item.actualRevenue += totalRevenue * (1 - FEE_PERCENT / 100);
        }
      }));

      return Ok(Array.from(statisticsMap.values()).sort((a, b) => {
        if (filterType === 'month') {
          return new Date(a.period).getTime() - new Date(b.period).getTime();
        }
        return parseInt(a.period) - parseInt(b.period);
      }));
    } catch (error) {
      this.slackService.sendError(`EventSvc >> GetOrgRevenueChartService: Failed to get org revenue chart: ${error.message}`);
      return Err(new Error('Internal server error'));
    }
  }
}