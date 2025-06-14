import { Inject, Injectable } from '@nestjs/common';
import { CheckoutResponseDataType, PayOSService } from '../../../common/payOS/payOS.service';
import { SlackService } from 'src/infrastructure/adapters/slack/slack.service';
import { PayOSInfoRepository } from 'src/services/payment-svc/repository/payOSInfo/payOsInfo.repo';

@Injectable()
export class PayOSCheckoutService {
  constructor(
    private readonly payOSService: PayOSService,
    private readonly slackService: SlackService,
    @Inject('PayOSInfoRepository') private readonly payOSInfoRepository: PayOSInfoRepository,
  ) {}

  async execute(
    orderCode: number, 
    userId: string, 
    amount: number,
    paymentCancelUrl: string,
    paymentSuccessUrl: string,
    ttl: number,
  ): Promise<CheckoutResponseDataType | Error> {
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

      // Save the PayOS checkout information to the repository
      await this.payOSInfoRepository.insertWithoutReturn({
        ...payOSCheckout
      })

      return payOSCheckout

    } catch (error) {
      await this.slackService.sendError(`Error during PayOS checkout for user ${userId} order ${orderCode}: ${error.message}`);
    
      return new Error(`PayOS checkout failed: ${error.message}`);
    }
  }
}