import { Inject, Injectable } from "@nestjs/common";
import { Result, Ok, Err } from "oxide.ts";
import { RevenueSummaryItem } from "./getOrgRevenueChart-response.dto";
import { GetAdminAccessService } from "src/services/auth-svc/modules/user/queries/get-admin-access/get-admin-access.service";
import { EventsRepository } from "src/services/event-svc/repository/events/events.repo";
import { SlackService } from "src/infrastructure/adapters/slack/slack.service";

const FEE_PERCENT = 10; // default, or can be got from OrgPaymentInfo table

@Injectable()
export class GetOrgRevenueChartService {
  constructor(
    @Inject('EventsRepository') private readonly eventsRepo: EventsRepository,
    private readonly getAdminAccessService: GetAdminAccessService,
    private readonly slackService: SlackService,
  ) {}

  async execute(email: string, fromDate?: string, toDate?: string, filterType: "month" | "year" = "month"): Promise<Result<RevenueSummaryItem[], Error>> {
    try {
      const isAdmin = await this.getAdminAccessService.execute(email);
      if (!isAdmin) {
        return Err(new Error('You do not have permission to get organizer revenue'));
      }

      const from = fromDate ? new Date(fromDate) : undefined;
      const to = toDate ? new Date(toDate) : undefined;

      if (from && to && from > to) {
        return Err(new Error('fromDate must be earlier than or equal to toDate'));
      }

      if (filterType && filterType !== 'month' && filterType !== 'year') {
        return Err(new Error("Invalid filterType. Must be 'month' or 'year'"))
      }

      const groupByFormat = filterType === "year" ? 'YYYY' : 'YYYY-MM';

      const result = await this.eventsRepo.findRevenueSummary(groupByFormat, FEE_PERCENT, from, to);

      if (result.isErr()) {
        return Err(new Error(result.unwrapErr().message));
      }

      if (result.unwrap().length === 0) {
        return Ok([]);
      }

      return result;
    } catch (error) {
      this.slackService.sendError(`EventSvc >> GetOrgRevenueChartService: Failed to get org revenue chart: ${error.message}`);
      return Err(new Error('Internal server error'));
    }
  }
}