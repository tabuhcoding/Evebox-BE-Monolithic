import { Injectable } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { SlackService } from "src/infrastructure/adapters/slack/slack.service";
import { GetAllEventDetailForRAGService } from "src/services/event-svc/modules/event/queries/getAllEventDetailForRAG/getAllEventDetailForRAG.service";
import { OpenAIVectorStoreService } from "src/services/rag-svc/modules/openai/core-embedding/vector-store.service";

@Injectable()
export class DailyEmbeddingService {
  constructor(
    private readonly slackService: SlackService, 
    private readonly getAllEventsForRagService: GetAllEventDetailForRAGService,
    private readonly openAIVectorStoreService: OpenAIVectorStoreService,
  ) {  }

  // @Cron('0 36 17 * * 3')
  async runDailyEmbedding() {
    try {
      const events = await this.getAllEventsForRagService.getAllEvents();
      if (events.length === 0) {
        await this.slackService.sendNotice("No events found for embedding.");
        return;
      }

      const batchSize = 100;
      for (let i = 2000; i < events.length; i += batchSize) {
        const batch = events.slice(i, i + batchSize);
        await this.openAIVectorStoreService.embedFullEventDocuments(batch);
        await this.slackService.sendNotice(`Embedded batch ${Math.floor(i / batchSize) + 1} of ${Math.ceil(events.length / batchSize)}.`);
      }

      await this.slackService.sendNotice("Daily embedding completed successfully.");

      for (let i = 800; i < events.length; i += batchSize) {
        const batch = events.slice(i, i + batchSize);
        await this.openAIVectorStoreService.embedSimilarityEventDocuments(batch);
        await this.slackService.sendNotice(`Embedded similar batch ${Math.floor(i / batchSize) + 1} of ${Math.ceil(events.length / batchSize)}.`);
      }
    } catch (error) {
      await this.slackService.sendError(`Daily embedding failed: ${error.message}`);
    }
  }
}