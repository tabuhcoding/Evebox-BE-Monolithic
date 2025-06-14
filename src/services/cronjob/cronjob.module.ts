import { Module } from "@nestjs/common";
import { DailyStatusService } from "./modules/dailyStatus/dailyStatus.service";
import { EventSvcModule } from "../event-svc/event-svc.module";
import { BookingSvcModule } from "../booking-svc/booking.module";
import { HourlyOrderStatusService } from "./modules/hourlyOrder/hourlyOrderStatus.service";

@Module({
  imports: [
    EventSvcModule,
    BookingSvcModule,
  ],
  controllers: [],
  providers: [DailyStatusService, HourlyOrderStatusService],
  exports: [],
})
export class CronjobModule {}