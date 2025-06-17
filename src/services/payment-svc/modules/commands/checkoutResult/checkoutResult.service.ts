import { Inject, Injectable } from "@nestjs/common";
import { SlackService } from "src/infrastructure/adapters/slack/slack.service";
import { FileCacheService } from "src/infrastructure/cache/fileCache/fileCache.service";
import { CreateOrderService } from "src/services/booking-svc/modules/commands/createOrder/createOrder.service";
import { GenerateQrcodeService } from "src/services/booking-svc/modules/commands/generateQrcode/generateQrcode.service";
import { GenerateTicketService } from "src/services/booking-svc/modules/commands/generateTicket/generateTicket.service";
import { BookingTicketStatus } from "src/services/booking-svc/repository/order/order.repo";
import { UpdateFormResponseService } from "src/services/event-svc/modules/formResponse/commands/updateFormResponse/updateFormResponse.service";
import { GetTicketTypeDetailService } from "src/services/event-svc/modules/ticketType/queries/getTicketTypeDetail/getTicketTypeDetail.service";
import { WebhookDataType } from "src/services/payment-svc/common/payOS/payOS.service";
import { AggregatedCheckoutDataItem } from "src/services/payment-svc/common/type";
import { PaymentInfoRepository } from "src/services/payment-svc/repository/paymentInfo/paymentInfo.repo";
import { PaymentMethod } from "src/services/payment-svc/repository/paymentMethodStatus/paymentMethodStatus.repo";
import { PayOSInfoRepository } from "src/services/payment-svc/repository/payOSInfo/payOsInfo.repo";

@Injectable()
export class CheckoutResultService {
  constructor(
    private readonly slackService: SlackService, 
    private readonly fileCacheService: FileCacheService,
    private readonly createOrderService: CreateOrderService,
    private readonly generateTicketService: GenerateTicketService,
    private readonly updateFormResponseService: UpdateFormResponseService,
    private readonly generateQrcodeService: GenerateQrcodeService,
    private readonly getTicketTypeDetailService: GetTicketTypeDetailService,
    @Inject('PayOSInfoRepository') private readonly payOSInfoRepository: PayOSInfoRepository,
    @Inject('PaymentInfoRepository') private readonly paymentInfoRepository: PaymentInfoRepository 
  ) { }

  async payOSCheckoutResult(webhookData: WebhookDataType): Promise<Boolean> {
    try {
      // Get the cached data for the payment link
      const paymentLinkID = webhookData.paymentLinkId;
      const cachedData = await this.fileCacheService.getCacheObjectById('payOS', {}, paymentLinkID) as AggregatedCheckoutDataItem | null;
      if (!cachedData) {
        await this.slackService.sendError(`PaymentService >>> PayOS checkout result verification failed: No cached data found for payment link ID ${paymentLinkID}`);
        
        return false;
      }

      // compare the amount in the cached data with the amount in the webhook data
      const cachedAmount = cachedData.data[0].totalAmount;
      if (cachedAmount !== webhookData.amount) {
        await this.slackService.sendError(`PaymentService >>> PayOS checkout result verification failed: Amount mismatch for payment link ID ${paymentLinkID}. Cached amount: ${cachedAmount}, Webhook amount: ${webhookData.amount}`);
        
        return false;
      }
      
      // update the order status and clear the cache
      // TODO: Need to run in transaction
      // Update seat status
      {
        const seatIDs = cachedData.data[0].ticketTypeSelection.map(ticket => ticket.seatInfo.map(seat => seat.seatId)).flat();
        await this.getTicketTypeDetailService.setSeatStatusToESold(cachedData.data[0].showingId, seatIDs);
      }
      // Generate the ticket
      const seatmapType = await this.generateTicketService.execute(webhookData.orderCode, cachedData.data[0].ticketTypeSelection)
      await this.fileCacheService.clearObject('payOS', {}, paymentLinkID);
      const orderUpdated = await this.createOrderService.updateOrderStatus(webhookData.orderCode, BookingTicketStatus.PAID)
      if (!orderUpdated) {
        await this.slackService.sendError(`PaymentService >>> PayOS checkout result verification failed: Failed to update order status for order code ${webhookData.orderCode}`);
        return false;
      }
      await this.paymentInfoRepository.updateOne(
        {
          paymentCode: webhookData.orderCode,
          method: PaymentMethod.PAYOS
        },
        { paidAt: new Date(webhookData.transactionDateTime) }
      )
      await this.payOSInfoRepository.updateOne(
        { paymentLinkId: webhookData.paymentLinkId },
        {
          status: "PAID",
        }
      )
      await this.updateFormResponseService.updateOrderId(
        orderUpdated.formResponseId,
        orderUpdated.id,
      )
      // Complete the order creation process
      await this.slackService.sendNotice(`PaymentService >>> PayOS checkout result verified successfully: Order ${webhookData.orderCode} has been generate ticket.`);

      // Double check the order status
      await this.generateQrcodeService.execute(webhookData.orderCode, seatmapType);
      // Complete the QR code generation process
      // Send Ticket QR code to User Email
      await this.generateQrcodeService.sendTicketEmailToUser(webhookData.orderCode);
      await this.slackService.sendNotice(`PaymentService >>> PayOS checkout result verified successfully: QR code generated for order ${webhookData.orderCode}.`);
    } catch (error) {
      await this.slackService.sendError(`PaymentService >>> PayOS checkout result verification failed: ${error.message}`);
      return false;
    }
  }

  async payOSCheckoutResultWithoutCheck(orderId: number): Promise<Boolean> {
    try{
      const paymentInfo = await this.paymentInfoRepository.findOne({ orderId: orderId });
      if (!paymentInfo) {
        await this.slackService.sendError(`PaymentService >>> PayOS checkout result verification failed: No payment info found for order ID ${orderId}`);
        return false;
      }
      if (paymentInfo.method !== PaymentMethod.PAYOS) {
        await this.slackService.sendError(`PaymentService >>> PayOS checkout result verification failed: Payment method is not PayOS for order ID ${orderId}`);
        return false;
      }

      const payOSInfo = await this.payOSInfoRepository.findOne({ orderCode: paymentInfo.paymentCode });
      if (!payOSInfo) {
        await this.slackService.sendError(`PaymentService >>> PayOS checkout result verification failed: No PayOS info found for order ID ${orderId}`);
        return false;
      }

      const cachedData = await this.fileCacheService.getCacheObjectById('payOS', {}, payOSInfo.paymentLinkId) as AggregatedCheckoutDataItem | null;
      if (!cachedData) {
        await this.slackService.sendError(`PaymentService >>> PayOS checkout result verification failed: No cached data found for payment link ID ${payOSInfo.paymentLinkId}`);
        return false;
      }

      {
        const seatIDs = cachedData.data[0].ticketTypeSelection.map(ticket => ticket.seatInfo.map(seat => seat.seatId)).flat();
        await this.getTicketTypeDetailService.setSeatStatusToESold(cachedData.data[0].showingId, seatIDs);
      }

      // Generate the ticket
      const seatmapType = await this.generateTicketService.execute(paymentInfo.paymentCode, cachedData.data[0].ticketTypeSelection);
      await this.fileCacheService.clearObject('payOS', {}, payOSInfo.paymentLinkId);
      const orderUpdated = await this.createOrderService.updateOrderStatus(orderId, BookingTicketStatus.PAID)
      if (!orderUpdated) {
        await this.slackService.sendError(`PaymentService >>> PayOS checkout result verification failed: Failed to update order status for order code ${orderId}`);
        return false;
      }
      await this.updateFormResponseService.updateOrderId(
        orderUpdated.formResponseId,
        orderUpdated.id,
      )

      // Complete the order creation process
      await this.slackService.sendNotice(`PaymentService >>> PayOS checkout result verified successfully: Order ${paymentInfo.paymentCode} has been generate ticket.`);
      // Double check the order status
      await this.generateQrcodeService.execute(paymentInfo.paymentCode, seatmapType);
      // Complete the QR code generation process
      await this.slackService.sendNotice(`PaymentService >>> PayOS checkout result verified successfully: QR code generated for order ${paymentInfo.paymentCode}.`);
      return true;      
    } catch (error) {
      await this.slackService.sendError(`PaymentService >>> PayOS checkout result verification failed: ${error.message}`);
      return false;
    }
  }
}