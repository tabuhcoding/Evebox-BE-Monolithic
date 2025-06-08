import { forwardRef, Module } from "@nestjs/common";
import { OrderRepositoryImpl } from "./repository/order/order.impl";
import { TicketRepositoryImpl } from "./repository/ticket/ticket.impl";
import { GetTotalTicketOfTicketTypeService } from "./modules/queries/getTotalTicketOfTicketType/getTotalTicketOfTicketType.service";
import { SelectSeatController } from "./modules/commands/selectSeat/selectSeat.controller";
import { SelectSeatService } from "./modules/commands/selectSeat/selectSeat.service";
import { AuthSvcModule } from "../auth-svc/auth-svc.module";
import { EventSvcModule } from "../event-svc/event-svc.module";
import { UnSelectSeatController } from "./modules/commands/unSelectSeat/unSelectSeat.controller";
import { GetRedisSeatController } from "./modules/queries/getRedisSeat/getRedisSeat.controller";
import { UnSelectSeatService } from "./modules/commands/unSelectSeat/unSelectSeat.service";
import { GetRedisSeatService } from "./modules/queries/getRedisSeat/getRedisSeat.service";
import { CountCheckedInTicketsService } from "./modules/queries/getCountCheckedInTickets/getCountCheckedInTickets.service";
import { CreateOrderService } from "./modules/commands/createOrder/createOrder.service";
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
    // Services

    GetTotalTicketOfTicketTypeService,

    SelectSeatService,
    UnSelectSeatService,
    GetRedisSeatService,

    CountCheckedInTicketsService,
    CreateOrderService,
    TicketQueryService,

    // Repositories
    { provide: 'OrderRepository', useClass: OrderRepositoryImpl },
    { provide: 'TicketRepository', useClass: TicketRepositoryImpl },
  ],
  exports: [GetTotalTicketOfTicketTypeService, CountCheckedInTicketsService, TicketQueryService, GetRedisSeatService, CreateOrderService
  ],
})
export class BookingSvcModule {}