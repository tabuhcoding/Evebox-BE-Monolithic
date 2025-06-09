import { Controller, Post, Body, Res, HttpStatus } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { SlackService } from 'src/infrastructure/adapters/slack/slack.service';
import { WebhookType } from 'src/services/payment-svc/common/payOS/payOS.service';
import { PayOSWebhookService } from './payosWebhook.service';
import { Response } from 'express';

@ApiTags('Webhooks')
@Controller('api/payment')
export class PayOSWebhookController {
  constructor(
    private readonly slackService: SlackService,
    private readonly payosWebhookService: PayOSWebhookService,
  ) {}

  @Post('/webhooks/payos')
  async getPayOSReturn(
    @Body() payload: WebhookType,
    @Res() res: Response,
  ) {
    this.slackService.sendNotice(`PayOS webhook received: ${JSON.stringify(payload)}`);

    try {
      await this.payosWebhookService.verifyWebhookData(payload);
    } catch (error) {
      this.slackService.sendError(`PayOS webhook verification failed: ${error.message}`);
    }
    finally {
      return res.status(HttpStatus.OK).json({
        statusCode: HttpStatus.OK,
        message: 'Payment Method status data retrieved successfully',
        data: null,
      });
    }
  }
}