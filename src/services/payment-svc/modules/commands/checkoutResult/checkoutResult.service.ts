import { Inject, Injectable } from "@nestjs/common";
import { SlackService } from "src/infrastructure/adapters/slack/slack.service";
import { FileCacheService } from "src/infrastructure/cache/fileCache/fileCache.service";
import { CreateOrderService } from "src/services/booking-svc/modules/commands/createOrder/createOrder.service";
import { GenerateTicketService } from "src/services/booking-svc/modules/commands/generateTicket/generateTicket.service";
import { BookingTicketStatus } from "src/services/booking-svc/repository/order/order.repo";
import { WebhookDataType } from "src/services/payment-svc/common/payOS/payOS.service";
import { AggregatedCheckoutDataItem } from "src/services/payment-svc/common/type";

@Injectable()
export class CheckoutResultService {
  constructor(
    private readonly slackService: SlackService, 
    private readonly fileCacheService: FileCacheService,
    private readonly createOrderService: CreateOrderService,
    private readonly generateTicketService: GenerateTicketService,
  ) { }

  async payOSCheckoutResult(webhookData: WebhookDataType): Promise<Boolean> {
    try {
      // Get the cached data for the payment link
      const paymentLinkID = webhookData.paymentLinkId;
      const cachedData = await this.fileCacheService.getCacheObjectById('payOS', {}, paymentLinkID) as AggregatedCheckoutDataItem | null;
      if (!cachedData) {
        this.slackService.sendError(`PaymentService >>> PayOS checkout result verification failed: No cached data found for payment link ID ${paymentLinkID}`);
        
        return false;
      }

      // compare the amount in the cached data with the amount in the webhook data
      const cachedAmount = cachedData.data[0].totalAmount;
      if (cachedAmount !== webhookData.amount) {
        this.slackService.sendError(`PaymentService >>> PayOS checkout result verification failed: Amount mismatch for payment link ID ${paymentLinkID}. Cached amount: ${cachedAmount}, Webhook amount: ${webhookData.amount}`);
        
        return false;
      }
      
      // update the order status and clear the cache
      // TODO: Need to run in transaction
      await this.fileCacheService.clearObject('payOS', {}, paymentLinkID);
      await this.createOrderService.updateOrderStatus(webhookData.orderCode, BookingTicketStatus.PAID)

      // Generate the ticket
      await this.generateTicketService.execute(webhookData.orderCode, cachedData.data[0].ticketTypeSelection)
    } catch (error) {
      this.slackService.sendError(`PaymentService >>> PayOS checkout result verification failed: ${error.message}`);
      return false;
    }
  }
}