import { Injectable } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { SlackService } from "src/infrastructure/adapters/slack/slack.service";
import { CalculateRevenueService } from "src/services/booking-svc/modules/commands/calculateRevenue/calculateRevenue.service";
import { GetAllEventDetailForRAGService } from "src/services/event-svc/modules/event/queries/getAllEventDetailForRAG/getAllEventDetailForRAG.service";
import { OpenAIVectorStoreService } from "src/services/rag-svc/modules/openai/core-embedding/vector-store.service";
import { GetPaymentInfoService } from "src/services/payment-svc/modules/queries/getPaymentInfo/getPaymentInfo.service";

@Injectable()
export class DailyEmbeddingService {
  constructor(
    private readonly slackService: SlackService, 
    private readonly getAllEventsForRagService: GetAllEventDetailForRAGService,
    private readonly openAIVectorStoreService: OpenAIVectorStoreService,
    private readonly calculateRevenueService: CalculateRevenueService,
    private readonly getPaymentInfoService: GetPaymentInfoService,
  ) {  }

  // @Cron('0 36 17 * * 3')
  @Cron('0 2 * * *') // Runs every day at midnight
  async runDailyEmbedding() {
    try {
      const events = await this.getAllEventsForRagService.getAllEvents(false);
      if (events.length === 0) {
        await this.slackService.sendNotice("No events found for embedding.");
        return;
      }
      await this.slackService.sendNotice(`Starting daily embedding for ${events.length} events.`);

      const batchSize = 100;
      for (let i = 0; i < events.length; i += batchSize) {
        const batch = events.slice(i, i + batchSize);
        await this.openAIVectorStoreService.embedFullEventDocuments(batch);
        await this.slackService.sendNotice(`Embedded batch ${Math.floor(i / batchSize) + 1} of ${Math.ceil(events.length / batchSize)}.`);
      }

      await this.slackService.sendNotice("Daily embedding completed successfully.");

      for (let i = 0; i < events.length; i += batchSize) {
        const batch = events.slice(i, i + batchSize);
        await this.openAIVectorStoreService.embedSimilarityEventDocuments(batch);
        await this.slackService.sendNotice(`Embedded similar batch ${Math.floor(i / batchSize) + 1} of ${Math.ceil(events.length / batchSize)}.`);
      }
    } catch (error) {
      await this.slackService.sendError(`Daily embedding failed: ${error.message}`);
    }
  }

  async runDailyEmbeddingAll() {
    try {
      const events = await this.getAllEventsForRagService.getAllEvents(true);
      if (events.length === 0) {
        await this.slackService.sendNotice("No events found for embedding.");
        return;
      }
      await this.slackService.sendNotice(`Starting daily embedding for ${events.length} events.`);
      // return
      const batchSize = 100;
      for (let i = 0; i < events.length; i += batchSize) {
        const batch = events.slice(i, i + batchSize);
        await this.openAIVectorStoreService.embedFullEventDocuments(batch);
        await this.slackService.sendNotice(`Embedded batch ${Math.floor(i / batchSize) + 1} of ${Math.ceil(events.length / batchSize)}.`);
        // return
      }

      await this.slackService.sendNotice("Daily embedding completed successfully.");

      for (let i = 0; i < events.length; i += batchSize) {
        const batch = events.slice(i, i + batchSize);
        await this.openAIVectorStoreService.embedSimilarityEventDocuments(batch);
        await this.slackService.sendNotice(`Embedded similar batch ${Math.floor(i / batchSize) + 1} of ${Math.ceil(events.length / batchSize)}.`);
      }
    } catch (error) {
      await this.slackService.sendError(`Daily embedding failed: ${error.message}`);
    }
  }

  // @Cron('05 1 * * *') // Runs every day at 3 AM
  async fakeOrderData() {
    try{
      await this.slackService.sendNotice("Starting to save fake order data for embedding.");
      const allShowing = await this.getAllEventsForRagService.getAllShowing();
      const allOrder = await this.calculateRevenueService.getAllOrderHasMoreThanThreeTickets();
      var ticketTypeMapping = new Map<string, number>();
      for (const order of allOrder) {
        await this.slackService.sendNotice(`Processing order ${order.id} for user ${order.userId}`);
        const showing = allShowing.get(order.showingId);
        if (!showing) continue;

        var beginDate = new Date(showing.startTime);
        var endDate = new Date(showing.endTime);
        for (const ticketType of showing.TicketType) {
          ticketTypeMapping.set(ticketType.id, ticketType.price);
          if (new Date(ticketType.startTime) < beginDate) {
            beginDate = new Date(ticketType.startTime);
          }
        }
        var newOrder = order
        do {
          newOrder = await this.calculateRevenueService.createNewOrder(
            newOrder.id,
            ticketTypeMapping,
            beginDate,
            endDate,
          )

          await this.slackService.sendNotice(`Created new order ${newOrder.id} for user ${newOrder.userId}`);

          const pmi = await this.getPaymentInfoService.createPaymentInfo(newOrder.id, newOrder.updatedAt)
          if (order.formResponseId){
            const fi = await this.getAllEventsForRagService.cloneFormResponse(order.formResponseId, newOrder.userId, newOrder.id);
            await this.calculateRevenueService.updateOrderPrice(newOrder.id, pmi, fi);
          }
          else {
            await this.calculateRevenueService.updateOrderPrice(newOrder.id, pmi, null);
          }
        } while (newOrder && newOrder.Ticket.length > 3);
      }
      await this.slackService.sendNotice("Fake order data saved successfully for embedding.");
    } catch (error) {
      await this.slackService.sendError(`Failed to save fake order data: ${error.message}`);
    }
  }
}
function betterRandom(range = 1) {
  return (Math.random() + (Date.now() % 1000) / 1000) % 1 * range;
}
function randomDate(start: Date, end: Date): Date {
  const date = new Date(start.getTime() + betterRandom(end.getTime() - start.getTime()));
  return date;
}