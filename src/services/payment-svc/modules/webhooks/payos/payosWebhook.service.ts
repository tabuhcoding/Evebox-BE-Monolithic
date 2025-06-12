import { Injectable } from "@nestjs/common";
import { SlackService } from "src/infrastructure/adapters/slack/slack.service";
import { PayOSService, WebhookType } from "src/services/payment-svc/common/payOS/payOS.service";
import { CheckoutResultService } from "../../commands/checkoutResult/checkoutResult.service";

@Injectable()
export class PayOSWebhookService{
  constructor(
    private readonly payosService: PayOSService,
    private readonly slackService: SlackService,
    private readonly checkoutResultService: CheckoutResultService,
  ) {}

  async verifyWebhookData(payload: WebhookType): Promise<void> {
    try {
      const webhookData = await this.payosService.verifyWebhookData(payload);

      if (!webhookData) {
        await this.slackService.sendError(`PaymentService >>> PayOS webhook verification failed: No data returned`);
        
        if( payload?.data?.paymentLinkId) {
          await this.payosService.cancelPaymentLink(payload?.data?.paymentLinkId, "Received invalid webhook data");
        }

        // Call service to handle invalid webhook data

        return;
      }

      // Process the verified webhook data
      await this.slackService.sendNotice(`PaymentService >>> PayOS webhook verified successfully: ${JSON.stringify(webhookData)}`);
      await this.checkoutResultService.payOSCheckoutResult(webhookData);
    } catch (error) {

      await this.slackService.sendError(`PaymentService >>> PayOS webhook verification failed: ${error.message}`);
    }
  }
}