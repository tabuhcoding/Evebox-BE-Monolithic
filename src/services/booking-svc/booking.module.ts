import { forwardRef, Module } from "@nestjs/common";
import { OrderRepositoryImpl } from "./repository/order/order.impl";
import { TicketRepositoryImpl } from "./repository/ticket/ticket.impl";
import { SlackService } from "src/infrastructure/adapters/slack/slack.service";
import { GetTotalTicketOfTicketTypeService } from "./modules/queries/getTotalTicketOfTicketType/getTotalTicketOfTicketType.service";
import { FileCacheService } from "src/infrastructure/cache/fileCache/fileCache.service";
import { SelectSeatController } from "./modules/commands/selectSeat/selectSeat.controller";
import { SelectSeatService } from "./modules/commands/selectSeat/selectSeat.service";
import { AuthSvcModule } from "../auth-svc/auth-svc.module";
import { EventSvcModule } from "../event-svc/event-svc.module";
import { UnSelectSeatController } from "./modules/commands/unSelectSeat/unSelectSeat.controller";
import { GetRedisSeatController } from "./modules/queries/getRedisSeat/getRedisSeat.controller";
import { UnSelectSeatService } from "./modules/commands/unSelectSeat/unSelectSeat.service";
import { GetRedisSeatService } from "./modules/queries/getRedisSeat/getRedisSeat.service";
import { CountCheckedInTicketsService } from "./modules/queries/getCountCheckedInTickets/getCountCheckedInTickets.service";
import { TicketQueryService } from "./modules/queries/getTicketQuery/ticket-query.service";

@Module({
  imports: [ 
     forwardRef(() => AuthSvcModule),
     forwardRef(() => EventSvcModule),
  ],
  controllers: [
    SelectSeatController,
    UnSelectSeatController,
    GetRedisSeatController,
  ],
  providers: [
    // Adapters

    SlackService,
    FileCacheService,

    // Services

    GetTotalTicketOfTicketTypeService,

    SelectSeatService,
    UnSelectSeatService,
    GetRedisSeatService,

    CountCheckedInTicketsService,
    TicketQueryService,

    // Repositories
    { provide: 'OrderRepository', useClass: OrderRepositoryImpl },
    { provide: 'TicketRepository', useClass: TicketRepositoryImpl },
  ],
  exports: [GetTotalTicketOfTicketTypeService, CountCheckedInTicketsService, TicketQueryService,
     {provide: 'TicketRepository', useClass: TicketRepositoryImpl }
  ],
})
export class BookingSvcModule {}