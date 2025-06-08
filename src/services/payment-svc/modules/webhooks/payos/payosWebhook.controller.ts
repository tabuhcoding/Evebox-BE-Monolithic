import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { SlackService } from 'src/infrastructure/adapters/slack/slack.service';
import { WebhookType } from 'src/services/payment-svc/common/payOS/payOS.service';
import { PayOSWebhookService } from './payosWebhook.service';

@ApiTags('Webhooks')
@Controller('api/payment')
export class GetPaymentMethodController {
  constructor(
    private readonly slackService: SlackService,
    private readonly payosWebhookService: PayOSWebhookService,
  ) {}

  @Post('/webhooks/payos')
  async getPayOSReturn(
    @Body() payload: WebhookType,
  ) {
    this.slackService.sendNotice(`PayOS webhook received: ${JSON.stringify(payload)}`);

    try {
      await this.payosWebhookService.verifyWebhookData(payload);
    } catch (error) {
      this.slackService.sendError(`PayOS webhook verification failed: ${error.message}`);
    }

    return { message: 'Webhook received and processed successfully' };
  }
}