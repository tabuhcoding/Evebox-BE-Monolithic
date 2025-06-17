import { Inject, Injectable } from "@nestjs/common";
import { SlackService } from "src/infrastructure/adapters/slack/slack.service";
import { BookingTicketStatus, OrderRepository } from "src/services/booking-svc/repository/order/order.repo";
import { getShowingSeatmapService } from "src/services/event-svc/modules/showing/queries/getShowingSeatmap/getShowingSeatmap.service";
import { GetPaymentStatusService } from "src/services/payment-svc/modules/queries/getPaymentStatus/getPaymentStatus.service";
import { GenerateQrcodeService } from "../generateQrcode/generateQrcode.service";
import { CheckoutResultService } from "src/services/payment-svc/modules/commands/checkoutResult/checkoutResult.service";

@Injectable()
export class RecheckOrderMissedService {
  constructor(
    @Inject('OrderRepository') private readonly orderRepository: OrderRepository,
    private readonly slackService: SlackService,
    private readonly getPaymentStatusService: GetPaymentStatusService,
    private readonly getSeatmapTypeService: getShowingSeatmapService,
    private readonly generateQrcodeService: GenerateQrcodeService,
    private readonly checkoutResultService: CheckoutResultService,
  ) {}
  
  async execute(): Promise<void> {
    var found = 0;
    var updated = 0;
    var deleted = 0;
    const missedOrders = await this.orderRepository.findAll({
      status: BookingTicketStatus.PENDING || BookingTicketStatus.PAID,
      createdAt: {
        gte: new Date(Date.now() - 4 * 60 * 60 * 1000), 
        lte: new Date(Date.now() - 30 * 60 * 1000),
      },
    })

    found = missedOrders.length;

    if (missedOrders.length === 0) {
      await this.slackService.sendNotice(`RecheckOrderMissedService >>> No missed orders found.`);
      
      return;
    }

    for (const order of missedOrders) {
      try{
        if ( order.status === BookingTicketStatus.PENDING) {
          const paymentStatus = await this.getPaymentStatusService.execute(order.id);
          if (paymentStatus === "" || paymentStatus === "CANCELED") {
            // If the payment status is empty or canceled, delete the order
            await this.orderRepository.deleteHardOne(order.id);
            deleted++;
          }
          else if (paymentStatus === "PENDING") {
            // If the payment status is pending, continue to the next order
            continue;
          }
        } else {
          // If the order is already PAID, we need to check if it was missed
          const seatmapType = await this.getSeatmapTypeService.getSeatMapType(order.showingId);

          await this.generateQrcodeService.execute(order.id, seatmapType);

          updated++;
        }

        // So now the order is PAID
        await this.slackService.sendNotice(`RecheckOrderMissedService >>> Order ${order.id} is PAID but missed, updating status to PAID.`);
        await this.orderRepository.updateOneById(order.id, {
          status: BookingTicketStatus.PAID,
        });

        const updateOrder = await this.checkoutResultService.payOSCheckoutResultWithoutCheck(order.id);
        if (updateOrder) {
          updated++;
        }
      }
      catch (error) {
        await this.slackService.sendError(`RecheckOrderMissedService >>> Error processing order ${order.id}: ${error.message}`);
      }
    }

    await this.slackService.sendNotice(`RecheckOrderMissedService >>> Processed ${found} missed orders: ${updated} updated, ${deleted} deleted.`);
  }
}