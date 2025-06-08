import { Module, forwardRef } from "@nestjs/common";
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
import { GetPaymentInfoService } from "./modules/queries/getPaymentInfo/getPaymentInfo.service";
import { PayOSService } from "./common/payOS/payOS.service";

@Module({
  imports: [
    forwardRef(() => BookingSvcModule),
    forwardRef(() => EventSvcModule),
  ],
  controllers: [
    // Queries
    GetPaymentMethodController,
    
    // Commands
    CheckoutController,
  ],
  providers: [
    // Adapters
    PayOSService,

    // Queries
    GetPaymentMethodService,
    GetPaymentInfoService,
    
    // Commands
    PayOSCheckoutService,

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
    GetPaymentInfoService,
  ],
})
export class PaymentSvcModule {}