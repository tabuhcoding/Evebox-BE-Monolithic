import { Injectable } from '@nestjs/common';
import { PayOSService } from '../../../common/payOS/payOS.service';
import { SlackService } from 'src/infrastructure/adapters/slack/slack.service';

@Injectable()
export class PayOSCheckoutService {
  constructor(
    private readonly payOSService: PayOSService,
    private readonly slackService: SlackService,
  ) {}

  async execute(
    orderCode: number, 
    userId: string, 
    amount: number,
    paymentCancelUrl: string,
    paymentSuccessUrl: string,
    ttl: number,
  ): Promise<string | Error> {
    try {
      const payOSCheckout = await this.payOSService.createPaymentLink(
        {
          orderCode,
          amount: amount,
          description: "Evebox"+ " - " + Date.now(),
          cancelUrl: paymentCancelUrl,
          returnUrl: paymentSuccessUrl + "?orderCode=" + orderCode,
          expiredAt: Math.floor(Date.now() / 1000) + ttl,
        }
      );
      
      if (!payOSCheckout || !payOSCheckout.checkoutUrl) {
        
        throw new Error('Failed to create PayOS checkout link.');
      }

      return payOSCheckout.checkoutUrl

    } catch (error) {
      this.slackService.sendError(`Error during PayOS checkout for user ${userId} order ${orderCode}: ${error.message}`);
    
      return new Error(`PayOS checkout failed: ${error.message}`);
    }
  }
}