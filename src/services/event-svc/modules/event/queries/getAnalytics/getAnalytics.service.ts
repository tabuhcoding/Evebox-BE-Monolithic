import { Inject, Injectable } from "@nestjs/common";
import { Result, Ok, Err } from "oxide.ts";

import { AnalyticsResponseData } from "./getAnalytics-response.dto";
import { EventsRepository } from "src/services/event-svc/repository/events/events.repo";
import { SlackService } from "src/infrastructure/adapters/slack/slack.service";
import { CheckUserExistService } from "src/services/auth-svc/modules/user/commands/checkuserExist/checkuserExist.service";
import { EVENT_ROLE } from "../../domain/eventRole";
import { GetAllEventDetailForRAGService } from "../getAllEventDetailForRAG/getAllEventDetailForRAG.service";
import { EventDocumentBuilder } from "src/services/rag-svc/modules/openai/core-embedding/event-document.builder";
import { FindUserByEmailService } from "src/services/auth-svc/modules/user/commands/find-user-by-email/findUserByEmail.service";

@Injectable()
export class GetAnalyticsService {
  constructor(
    @Inject('EventsRepository') private readonly eventRepository: EventsRepository,
    private readonly slackService: SlackService,
    private readonly checkUserExistService: CheckUserExistService,
    private readonly findUserByEmail: FindUserByEmailService, 
    private readonly getAllEventForRagService: GetAllEventDetailForRAGService
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

      const user = await this.findUserByEmail.execute(userEmail);
      if (!user) return Err(new Error('User not found'))

      const canManage = await this.eventRepository.hasPermissionToManageEvent(eventId, user.id.value, EVENT_ROLE.MARKETING);
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

  async executeAI(eventId: number, startDate?: Date, endDate?: Date, userRequest?: string): Promise<Result<string, Error>> {
    try {
      const event = await this.getAllEventForRagService.getEventById(eventId);
      if (!event) {
        return Err(new Error('Event not found'));
      }
      const result = await this.execute(eventId, event.organizerId, startDate, endDate);
      const doc = EventDocumentBuilder.buildFullDocument(event);

      if (result.isErr()) {
        return Err(new Error(result.unwrapErr().message));
      }

      const data = result.unwrap();

      const payload = {
        data: data,
        query: userRequest || "",
        event: doc.pageContent
      };

      const responseAI = await fetch(`${process.env.UTILS_URL}/analytics`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!responseAI.ok) {
        const errorData = await responseAI.json();
        return Err(new Error(errorData.detail || 'Failed to analyze revenue data'));
      }

      const responseAIData = await responseAI.json();

      return Ok(responseAIData.result);
    } catch (error) {
      await this.slackService.sendError(`Event Service - Event analytics with AI >>> GetAnalyticsService: ${error.message}`);

      return Err(new Error('Failed to retrieve events'));
    }
  }
}