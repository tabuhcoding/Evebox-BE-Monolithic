import { Module } from "@nestjs/common";
import { DailyStatusService } from "./modules/dailyStatus/dailyStatus.service";
import { EventSvcModule } from "../event-svc/event-svc.module";

@Module({
  imports: [
    EventSvcModule,
  ],
  controllers: [],
  providers: [DailyStatusService],
  exports: [],
})
export class CronjobModule {}