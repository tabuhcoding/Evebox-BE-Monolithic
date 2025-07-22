import { Inject, Injectable } from "@nestjs/common";
import { Result, Err, Ok } from "oxide.ts";
import { EventsRepository } from "src/services/event-svc/repository/events/events.repo";
import { GetAdminAccessService } from "src/services/auth-svc/modules/user/queries/get-admin-access/get-admin-access.service";
import { GetOrdersWithTypeService } from "src/services/booking-svc/modules/queries/getOrdersWithType/getOrdersWithType.service";
import { SlackService } from "src/infrastructure/adapters/slack/slack.service";
import { RevenueByTicketPriceData } from "./getRevenueByTicketPrice-response.dto";
import { FileCacheService } from "src/infrastructure/cache/fileCache/fileCache.service";
import { SaveRevenueDataService } from "src/services/auth-svc/modules/admin/commands/saveRevenueData/saveRevenueData.service";

@Injectable()
export class GetRevenueByTicketPriceService {
  constructor(
    @Inject('EventsRepository') private readonly eventsRepository: EventsRepository,
    private readonly getAdminAccessService: GetAdminAccessService,
    private readonly slackService: SlackService,
    private readonly getOrdersWithTypeService: GetOrdersWithTypeService,
    private readonly fileCacheService: FileCacheService,
    private readonly saveRevenueDataService: SaveRevenueDataService,
  ) {}

  async execute(email: string): Promise<Result<RevenueByTicketPriceData[], Error>> {
    try {
      const cacheData = await this.fileCacheService.getCache('getRevenueByTicketPrice', {}) as RevenueByTicketPriceData[];
      if (cacheData && cacheData.length > 0) {
        return Ok(cacheData);
      }
      const isAdmin = await this.getAdminAccessService.execute(email);
      if (!isAdmin) return Err(new Error('You do not have permission to get organizer revenue'));

      const ticketTypeRanges = await this.eventsRepository.getTicketTypePriceRange();

      const ticketTypeMappingResult = await this.getOrdersWithTypeService.execute();
      if (ticketTypeMappingResult.isErr()) {
        return Err(new Error(ticketTypeMappingResult.unwrapErr().message));
      }

      const ticketTypeMapping = ticketTypeMappingResult.unwrap();

      const result: RevenueByTicketPriceData[] = [];

      await Promise.all(ticketTypeRanges.map(async (range) => {
        const ticketTypes = range.ticketTypes;
        var totalSold = 0;
        var totalRevenue = 0;
        var totalQuantity = 0;
        for (const ticketType of ticketTypes) {
          const sold = ticketTypeMapping[ticketType.id] || 0;
          totalSold += sold;
          totalRevenue += sold * ticketType.price;
          totalQuantity += ticketType.quantity || 0;
        }
        result.push({
          minPrice: range.minPrice,
          maxPrice: range.maxPrice,
          total: totalQuantity,
          sold: totalSold,
          conversionRate: totalQuantity ? totalSold / totalQuantity : 0,
          revenue: totalRevenue,
        });
      }));

      await this.fileCacheService.cacheEndpoint(
        'getRevenueByTicketPrice',
        60 * 24,
        {},
        result,
      );

      return Ok(result);
    } catch (error) {
      await this.slackService.sendError(`Event Service - Admin - Statistics >>> GetOrgRevenueByTicketPriceService: ${error.message}`);
      return Err(new Error('Internal server error'));
    }
  }

  async executeV2(): Promise<Result<RevenueByTicketPriceData[], Error>> {
    try {
      const data = await this.eventsRepository.getTicketTypePriceRangeWithCount();

      const result = await this.saveRevenueDataService.addTotalSoldToTicketTypeRevenue(data);
      return Ok(result);
    }
    catch (error) {
      await this.slackService.sendError(`Event Service - Admin - Statistics >>> GetOrgRevenueByTicketPriceService: ${error.message}`);
      return Err(new Error('Internal server error'));
    }
  }

  
}