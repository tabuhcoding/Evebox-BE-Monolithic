import { Module } from "@nestjs/common";
import { DailyStatusService } from "./modules/dailyStatus/dailyStatus.service";
import { EventSvcModule } from "../event-svc/event-svc.module";
import { BookingSvcModule } from "../booking-svc/booking.module";
import { HourlyOrderStatusService } from "./modules/hourlyOrder/hourlyOrderStatus.service";
import { DailyEmbeddingService } from "./modules/dailyEmbedding/dailyEmbedding.service";
import { OpenAIModule } from "../rag-svc/modules/openai/openAI.module";
import { AuthSvcModule } from "../auth-svc/auth-svc.module";
import { PaymentSvcModule } from "../payment-svc/payment-svc.module";

@Module({
  imports: [
    EventSvcModule,
    BookingSvcModule,
    AuthSvcModule,
    OpenAIModule,
    PaymentSvcModule,
  ],
  controllers: [],
  providers: [DailyStatusService, HourlyOrderStatusService, DailyEmbeddingService],
  exports: [],
})
export class CronjobModule {}