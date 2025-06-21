import { Inject, Injectable } from "@nestjs/common";
import { SlackService } from "src/infrastructure/adapters/slack/slack.service";
import { PayOSService } from "src/services/payment-svc/common/payOS/payOS.service";
import { PaymentInfoRepository } from "src/services/payment-svc/repository/paymentInfo/paymentInfo.repo";
import { PaymentMethod } from "src/services/payment-svc/repository/paymentMethodStatus/paymentMethodStatus.repo";
import { PayOSInfoRepository } from "src/services/payment-svc/repository/payOSInfo/payOsInfo.repo";

@Injectable()
export class GetPaymentStatusService {
  constructor(
    @Inject('PaymentInfoRepository') private readonly paymentInfoRepository: PaymentInfoRepository,
    @Inject('PayOSInfoRepository') private readonly payOSInfoRepository: PayOSInfoRepository,
    private readonly slackService: SlackService,
    private readonly payOSService: PayOSService, 
  ) {}

  async execute(orderId: number): Promise<string> {
    try{
      const paymentInfo = await this.paymentInfoRepository.findOne({orderId: orderId});
      if (!paymentInfo) {
        await this.slackService.sendError(` Payment Svc >>> GetPaymentStatusService : No payment info found for orderId: ${orderId}`);
        return "";
      }

      switch (paymentInfo.method) {
        case PaymentMethod.PAYOS:
          const payOSInfo = await this.payOSInfoRepository.findOne({ orderCode: paymentInfo.paymentCode });
          if (!payOSInfo) {
            await this.slackService.sendError(` Payment Svc >>> GetPaymentStatusService : No PayOS info found for orderId: ${orderId}`);
            return "";
          }

          if (payOSInfo.status === "PAID") return "PAID";

          if (payOSInfo.status === "CANCELED") return "CANCELED";

          const payOSStatus = await this.payOSService.getPaymentLinkInformation(payOSInfo.paymentLinkId);
          await this.slackService.sendNotice(`Payment Svc >>> RecheckOrder at GetPaymentStatusService : PayOS status for orderId ${orderId} is ${JSON.stringify(payOSStatus)}`);
          if (payOSStatus && payOSStatus.status === "PAID") {
            // Update the payment info to reflect the paid status
            await this.payOSInfoRepository.updateOne(
              { orderCode: payOSStatus.orderCode },
              { status: "PAID"}
            );

            await this.paymentInfoRepository.updateOne(
              { orderId: orderId},
              { paidAt: new Date(payOSStatus.transactions[0].transactionDateTime) }
            );

            return "PAID";
          } else {
            if (!payOSInfo.expiredAt || (payOSInfo.expiredAt && new Date(payOSInfo.expiredAt) < new Date())) {
             return "CANCELED"
            }
            return "PENDING";
          }
        default:
          return "CANCELED";
      }
    }catch (error) {
      // console.error("🚀 ~ GetPaymentStatusService ~ execute ~ error:", error);
      await this.slackService.sendError(` Payment Svc >>> GetPaymentStatusService : ${error.message} with paymentId: ${orderId}`);
      
      return ""; // Re-throw the error after logging
    }
    // return "Payment status result";
  }
}