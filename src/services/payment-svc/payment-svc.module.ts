import { Module } from "@nestjs/common";
import { GetPaymentMethodController } from "./modules/queries/getPaymentMethod/getPaymentMethod.controller";
import { SlackService } from "src/infrastructure/adapters/slack/slack.service";
import { FileCacheService } from "src/infrastructure/cache/fileCache/fileCache.service";
import { PaymentMethodStatusRepositoryImpl } from "./repository/paymentMethodStatus/paymentMethodStatus.impl";
import { PayOSInfoRepositoryImpl } from "./repository/payOSInfo/payOsInfo.impl";
import { PaymentInfoRepositoryImpl } from "./repository/paymentInfo/paymentInfo.impl";
import { BookingSvcModule } from "../booking-svc/booking.module";
import { EventSvcModule } from "../event-svc/event-svc.module";
import { GetPaymentMethodService } from "./modules/queries/getPaymentMethod/getPaymentMethod.service";
import { PayOSCheckoutService } from "./modules/commands/payOSCheckout/payOSCheckout.service";
import { CheckoutService } from "./modules/commands/checkout/checkout.service";
import { CheckoutController } from "./modules/commands/checkout/checkout.controller";
import { PayOSService } from "./common/payOS/payOS.service";
import { PayOSWebhookController } from "./modules/webhooks/payos/payosWebhook.controller";
import { CheckoutResultService } from "./modules/commands/checkoutResult/checkoutResult.service";
import { PayOSWebhookService } from "./modules/webhooks/payos/payosWebhook.service";

@Module({
  imports: [
    BookingSvcModule,
    EventSvcModule,
  ],
  controllers: [
    // Queries
    GetPaymentMethodController,
    
    // Commands
    CheckoutController,

    // Webhooks
    PayOSWebhookController,
  ],
  providers: [
    // Adapters
    PayOSService,

    // Queries
    GetPaymentMethodService,
    
    // Commands
    PayOSCheckoutService,
    PayOSWebhookService,

    CheckoutService,
    CheckoutResultService,

    // Repositories
    {
      provide: 'PaymentMethodStatusRepository', useClass: PaymentMethodStatusRepositoryImpl
    },
    {
      provide: 'PayOSInfoRepository', useClass: PayOSInfoRepositoryImpl,
    },
    {
      provide: 'PaymentInfoRepository', useClass: PaymentInfoRepositoryImpl,
    }
  ],
  exports: [

  ],
})
export class PaymentSvcModule {}