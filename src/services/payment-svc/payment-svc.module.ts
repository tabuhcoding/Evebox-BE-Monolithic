import { Module } from "@nestjs/common";
import { getPaymentMethodController } from "./modules/queries/getPaymentMethod/getPaymentMethod.controller";
import { SlackService } from "src/infrastructure/adapters/slack/slack.service";
import { FileCacheService } from "src/infrastructure/cache/fileCache/fileCache.service";
import { PaymentMethodStatusRepositoryImpl } from "./repository/paymentMethodStatus/paymentMethodStatus.impl";
import { PayOSInfoRepositoryImpl } from "./repository/payOSInfo/payOsInfo.impl";
import { PaymentInfoRepositoryImpl } from "./repository/paymentInfo/paymentInfo.impl";
import { PayOSModule } from "./common/payOS/payOS.module";
import { BookingSvcModule } from "../booking-svc/booking.module";
import { EventSvcModule } from "../event-svc/event-svc.module";
import { getPaymentMethodService } from "./modules/queries/getPaymentMethod/getPaymentMethod.service";
import { PayOSCheckoutService } from "./modules/commands/payOSCheckout/payOSCheckout.service";
import { CheckoutService } from "./modules/commands/checkout/checkout.service";
import { CheckoutController } from "./modules/commands/checkout/checkout.controller";

@Module({
  imports: [
    PayOSModule,
    BookingSvcModule,
    EventSvcModule,
  ],
  controllers: [
    // Queries
    getPaymentMethodController,
    // Commands
    CheckoutController,
  ],
  providers: [
    SlackService,
    FileCacheService,

    PayOSCheckoutService,

    // Queries
    getPaymentMethodService,
    
    // Commands
    CheckoutService,

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