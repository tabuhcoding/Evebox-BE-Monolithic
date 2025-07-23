import { Inject, Injectable } from "@nestjs/common";
import { Result, Ok, Err } from "oxide.ts";

import { EventsRepository } from "src/services/event-svc/repository/events/events.repo";
import { ShowingWithEventRepository } from "src/services/event-svc/repository/showing/showingWithEvent.repo";
import { EventSummaryData } from "./getEventSummary-response.dto";
import { EVENT_ROLE } from "../../domain/eventRole";
import { SlackService } from "src/infrastructure/adapters/slack/slack.service";
import { CheckUserExistService } from "src/services/auth-svc/modules/user/commands/checkuserExist/checkuserExist.service";
import { GetAllEventDetailForRAGService } from "../getAllEventDetailForRAG/getAllEventDetailForRAG.service";
import { EventDocumentBuilder } from "src/services/rag-svc/modules/openai/core-embedding/event-document.builder";
import { FindUserByEmailService } from "src/services/auth-svc/modules/user/commands/find-user-by-email/findUserByEmail.service";
import { FileCacheService } from "src/infrastructure/cache/fileCache/fileCache.service";
import { AIAnalystService } from "src/services/auth-svc/modules/admin/commands/aiAnalyst/aiAnalyst.service";
import { Pagination, PaginationQuery } from "src/shared/constants/pagination";
import { AIAnalyst } from "src/services/auth-svc/repository/ai-analyst/ai-analyst.repo";

@Injectable()
export class GetEventSummaryService {
  constructor(
    @Inject('EventsRepository') private readonly eventRepository: EventsRepository,
    @Inject('ShowingWithEventRepository') private readonly showingWithEventRepository: ShowingWithEventRepository,
    private readonly slackService: SlackService,    
    private readonly findUserByEmail: FindUserByEmailService, 
    private readonly checkUserExistService: CheckUserExistService,
    private readonly getAllEventForRagService: GetAllEventDetailForRAGService,
    private readonly fileCacheService: FileCacheService,
    private readonly AIAnalystService: AIAnalystService,
  ) {}

  async execute(showingId: string, organizerId: string): Promise<Result<EventSummaryData, Error>> {
    try {
      const userExists = await this.checkUserExistService.execute(organizerId);
      if (!userExists) {
        return Err(new Error('User does not exist'));
      }

      const user = await this.findUserByEmail.execute(organizerId);
      if (!user) return Err(new Error('User not found'));

      const showing = await this.showingWithEventRepository.findOneById(showingId);
      if (!showing) {
        return Err(new Error('Showing not found'));
      }

      const canSummarized = await this.eventRepository.hasPermissionToManageEvent(showing.eventId, user.email.value, EVENT_ROLE.IS_SUMMARIZED);
      if (canSummarized.isErr()) {
        return Err(new Error(canSummarized.unwrapErr().message));
      }

      if (!canSummarized.unwrap()) {
        return Err(new Error('You do not have permisison to get event summary'));
      }

      const result = await this.eventRepository.getEventSummary(showingId);
      if (result.isErr()) {
        return Err(new Error(result.unwrapErr().message));
      }

      return result;
    } catch (error) {
      await this.slackService.sendError(`Event Service - Event summary >>> GetEventSummaryService: ${error.message}`);

      return Err(new Error('Failed to retrieve events'));
    }
  }

  async executeAI(showingId: string, userRequest?: string): Promise<Result<string, Error>> {
    try {
      var payload: any = {
        query: userRequest || "",
      };

      const cacheData = await this.fileCacheService.getCacheObjectById("summary-ai", {}, showingId);

      if (cacheData && cacheData.data[0].threadId) {
        payload = {
          ...payload,
          threadId: cacheData.data[0].threadId,
        };
      }
      else {
        const event = await this.getAllEventForRagService.getEventByShowingId(showingId);
        const result = await this.execute(showingId, event.organizerId);

        if (result.isErr()) {
          return Err(new Error(result.unwrapErr().message));
        }

        const data = result.unwrap();

        const doc = EventDocumentBuilder.buildFullDocument(event);

        payload = {
          ...payload,
          data: data,
          event: doc.pageContent
        };
      }
      const responseAI = await fetch(`${process.env.UTILS_URL}/revenue/v2`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!responseAI.ok || responseAI.status !== 200) {
        const errorData = await responseAI.json();
        return Err(new Error(errorData.detail || 'Failed to analyze revenue data'));
      }

      const responseAIData = await responseAI.json();

      await this.slackService.sendNotice(`Event Service - Event summary with AI >>> GetEventSummaryService: ${JSON.stringify(payload)}.
      Result: ${JSON.stringify(responseAIData)}`);

      if (!responseAIData.content) {
        return Err(new Error('No result returned from AI analysis'));
      }
      await this.fileCacheService.cacheObject("summary-ai",
        20,
        {},
        showingId,
        [{
          threadId: responseAIData.threadId
        }]
      );

      try {
        await this.AIAnalystService.createAIAnalyst(
          showingId,
          responseAIData.content,
          responseAIData.threadId,
          "org-summary",
          userRequest || "",
        );
      } catch (error) {
        this.slackService.sendError(`Event Service - Admin - AIAnalyst >>> Create AI Analyst entry failed: ${error.message}`);
      }
      return Ok(responseAIData.content);
    } catch (error) {
      await this.slackService.sendError(`Event Service - Event summary with AI >>> GetEventSummaryService: ${error.message}`);

      return Err(new Error('Internal server error'));
    }
  }

  async getAISummary(showingId: string, pagination: PaginationQuery): Promise<Result<[AIAnalyst[], Pagination], Error>>{
    try {
      const event = await this.showingWithEventRepository.findOneById(showingId);
      if (!event) {
        return Err(new Error('Event not found'));
      }

      const aiAnalystData = await this.AIAnalystService.getAIAnalyst(showingId, "org-summary", pagination);

      return Ok(aiAnalystData);
    } catch (error) {
      await this.slackService.sendError(`Event Service - Event analytics with AI >>> GetAnalyticsService: ${error.message}`);
      return Err(new Error('Failed to retrieve AI analytics'));
    }
  }
}
