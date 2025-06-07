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

@Module({
  imports: [
    PayOSModule,
    BookingSvcModule,
    EventSvcModule,
  ],
  controllers: [
    getPaymentMethodController
  ],
  providers: [
    SlackService,
    FileCacheService,

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