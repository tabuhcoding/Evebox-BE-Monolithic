import { Inject, Injectable } from "@nestjs/common";
import { Result, Ok, Err } from "oxide.ts";
import { ProvinceRevenueData } from "./getOrgRevenueByProvince-response.dto";
import { EventsRepository } from "src/services/event-svc/repository/events/events.repo";
import { GetAdminAccessService } from "src/services/auth-svc/modules/user/queries/get-admin-access/get-admin-access.service";
import { SlackService } from "src/infrastructure/adapters/slack/slack.service";

@Injectable()
export class GetOrgRevenueByProvinceService {
  constructor(
    @Inject('EventsRepository') private readonly eventsRepository: EventsRepository,
    private readonly getAdminAccessService: GetAdminAccessService,
    private readonly slackService: SlackService,
  ) {}

  async execute(email: string): Promise<Result<ProvinceRevenueData[], Error>> {
    try {
      const isAdmin = await this.getAdminAccessService.execute(email);
      if (!isAdmin) return Err(new Error('You do not have permission to get organizer revenue'));

      const result = await this.eventsRepository.getOrgRevenueByProvince();
      if (result.isErr()) {
        return Err(new Error(result.unwrapErr().message));
      }

      return result;
    } catch (error) {
      await this.slackService.sendError(`Event Service - Admin - Statistics >>> GetOrgRevenueByProvinceService: ${error.message}`);
      return Err(new Error('Internal server error'));
    }
  }
}