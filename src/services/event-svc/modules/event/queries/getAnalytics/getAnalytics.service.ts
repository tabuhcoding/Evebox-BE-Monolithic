import { Inject, Injectable } from "@nestjs/common";
import { Result, Ok, Err } from "oxide.ts";

import { AnalyticsResponseData } from "./getAnalytics-response.dto";
import { EventsRepository } from "src/services/event-svc/repository/events/events.repo";
import { SlackService } from "src/infrastructure/adapters/slack/slack.service";
import { CheckUserExistService } from "src/services/auth-svc/modules/user/commands/checkuserExist/checkuserExist.service";
import { EVENT_ROLE } from "../../domain/eventRole";

@Injectable()
export class GetAnalyticsService {
  constructor(
    @Inject('EventsRepository') private readonly eventRepository: EventsRepository,
    private readonly slackService: SlackService,
    private readonly checkUserExistService: CheckUserExistService,
  ) { }

  async execute(eventId: number, userEmail: string, startDate?: Date, endDate?: Date): Promise<Result<AnalyticsResponseData, Error>> {
    try {
      const event = await this.eventRepository.findOneById(eventId);
      if (!event) {
        return Err(new Error('Event not found'));
      }

      const userExists = await this.checkUserExistService.execute(userEmail);
      if (!userExists) {
        return Err(new Error('User does not exist'));
      }

      const canManage = await this.eventRepository.hasPermissionToManageEvent(eventId, userEmail, EVENT_ROLE.VIEW_ORDER);
      if (canManage.isErr()) {
        return Err(new Error(canManage.unwrapErr().message));
      }

      if (!canManage.unwrap()) {
        return Err(new Error('You do not have permisison to get event analytics'));
      }

      const totalUsersResult = await this.eventRepository.countUniqueUsersByEvent(eventId, startDate, endDate);

      if (totalUsersResult.isErr()) {
        return Err(new Error(totalUsersResult.unwrapErr().message));
      }

      const totalUsers = totalUsersResult.unwrap();

      const totalOrdersResult = await this.eventRepository.countOrdersByEvent(eventId);

      if (totalOrdersResult.isErr()) {
        return Err(new Error(totalOrdersResult.unwrapErr().message));
      }

      const totalOrders = totalOrdersResult.unwrap();

      const totalBuyersResponse = await this.eventRepository.countBuyersByEvent(eventId);

      if (totalBuyersResponse.isErr()) {
        return Err(new Error(totalBuyersResponse.unwrapErr().message));
      }

      const totalBuyers = totalBuyersResponse.unwrap();

      const statisticResponse = await this.eventRepository.getStatistics(eventId);

      if (statisticResponse.isErr()) {
        return Err(new Error(statisticResponse.unwrapErr().message));
      }

      const statistic = statisticResponse.unwrap();

      const response: AnalyticsResponseData = {
        eventId: event.id,
        eventTitle: event.title,
        totalClicks: event.totalClicks,
        weekClicks: event.weekClicks,
        totalUsers: totalUsers + totalBuyers,
        totalBuyers,
        transferRating: (totalBuyers / (totalUsers + totalBuyers)),
        totalOrders,
        statistic
      };

      return Ok(response);
    } catch (error) {
      await this.slackService.sendError(`Event Service - Event analytics >>> GetAnalyticsService: ${error.message}`);

      return Err(new Error('Failed to retrieve events'));
    }
  }
}