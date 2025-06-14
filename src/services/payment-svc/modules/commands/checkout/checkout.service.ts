import { Inject, Injectable } from '@nestjs/common';
import { Result, Ok, Err } from 'oxide.ts';
import { CheckoutDto } from './checkout.dto';
import { CheckoutResponseData } from './checkout-response.dto';
import { SlackService } from 'src/infrastructure/adapters/slack/slack.service';
import { GetRedisSeatService } from 'src/services/booking-svc/modules/queries/getRedisSeat/getRedisSeat.service';
import { CreateOrderService } from 'src/services/booking-svc/modules/commands/createOrder/createOrder.service';
import { PaymentMethod } from 'src/services/payment-svc/repository/paymentMethodStatus/paymentMethodStatus.repo';
import { PayOSCheckoutService } from '../payOSCheckout/payOSCheckout.service';
import { FileCacheService } from 'src/infrastructure/cache/fileCache/fileCache.service';
import { PaymentInfoRepository } from 'src/services/payment-svc/repository/paymentInfo/paymentInfo.repo';

@Injectable()
export class CheckoutService {
  constructor(
    private readonly slackService: SlackService, 
    private readonly getRedisSeat: GetRedisSeatService,  
    private readonly createOrderService: CreateOrderService,
    private readonly payOSCheckoutService: PayOSCheckoutService,
    private readonly fileCacheService: FileCacheService,
    @Inject('PaymentInfoRepository') private readonly paymentInfoRepository: PaymentInfoRepository
  ) {}

  async execute(checkoutDto: CheckoutDto, userId: string): Promise<Result<CheckoutResponseData, Error>> {
    try {
      // Get user's seat information from Redis
      const redisSeatResult = await this.getRedisSeat.execute(checkoutDto.showingID, userId);
      if (redisSeatResult.isErr()) {
        await this.slackService.sendError(`Error getting Redis seat for user ${userId}: ${redisSeatResult.unwrapErr().message}`);

        return Err(new Error('Failed to retrieve seat information.'));
      }

      const redisSeat = redisSeatResult.unwrap();
      // Check if the seat is not null or not expired
      if (!redisSeat || redisSeat.expiredTime <= 0) {
        await this.slackService.sendError(`Seat not found or expired for user ${userId} in showing ${checkoutDto.showingID}`);
        
        return Err(new Error('Invalid seat or ticket type'));
      }

      // Create the order code
      const orderCode = await this.createOrderService.execue(checkoutDto.showingID, redisSeat.totalAmount, userId);
      if (!orderCode) {
        await this.slackService.sendError(`Failed to create order for user ${userId} in showing ${checkoutDto.showingID}`);
        
        return Err(new Error('Failed to create order.'));
      }

      // Create the payment link
      switch (checkoutDto.paymentMethod) {
        case PaymentMethod.PAYOS:
          const checkoutResult = await this.payOSCheckoutService.execute(
            orderCode,
            userId,
            redisSeat.totalAmount,
            checkoutDto.paymentCancelUrl,
            checkoutDto.paymentSuccessUrl,
            redisSeat.expiredTime >> 0
          )

          if (checkoutResult instanceof Error) {
            await this.slackService.sendError(`PayOS checkout failed for user ${userId} in showing ${checkoutDto.showingID}: ${checkoutResult.message}`);
            
            return Err(checkoutResult);
          }

          await this.slackService.sendNotice(`PayOS checkout link created successfully for user ${userId} in showing ${checkoutDto.showingID}. Link: ${JSON.stringify(checkoutResult)}`);

          // insert paymentInfo into repository
          const paymentInfoID = await this.paymentInfoRepository.insertOneWithNumberId({
            method: checkoutDto.paymentMethod,
            paymentCode: checkoutResult.orderCode,
            orderId: orderCode
          })

          if (!paymentInfoID) {
            await this.slackService.sendError(`Failed to insert payment info for user ${userId} in showing ${checkoutDto.showingID}`);

            return Err(new Error('Error database server.'));
          }
          
          // Cache the payment link
          await this.fileCacheService.cacheObject(
            `payOS`,
            60*5,{},
            checkoutResult.paymentLinkId,
            [redisSeat]
          )

          return Ok({
            paymentLink: checkoutResult.checkoutUrl,
          })
        default:
          await this.slackService.sendError(`Payment method ${checkoutDto.paymentMethod} not available for user ${userId} in showing ${checkoutDto.showingID}`);
          
          return Err(new Error('PaymentMethod not available.'));
      }
    } catch (error) {
      await this.slackService.sendError(`Error during checkout with ${checkoutDto.paymentMethod}: ${error.message}`);
      
      return Err(new Error('PaymentMethod not available.'));
    }
  }
}