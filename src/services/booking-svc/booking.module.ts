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
import { GetPaidOrdersByShowingIdService } from "./modules/queries/getPaidOrdersByShowingId/getPaidOrdersByShowingId.service";
import { PaymentSvcModule } from "../payment-svc/payment-svc.module";
import { GetOrdersByShowingIdController } from "./modules/queries/getOrdersByShowingId/getOrdersByShowingId.controller";
import { GetOrdersByShowingIdService } from "./modules/queries/getOrdersByShowingId/getOrdersByShowingId.service";
import { GetOrdersInShowingIdsService } from "./modules/queries/getOrdersInShowingIds/getOrdersInShowingIds.service";
import { GenerateTicketService } from "./modules/commands/generateTicket/generateTicket.service";

@Module({
  imports: [ 
     forwardRef(() => AuthSvcModule),
     forwardRef(() => EventSvcModule),
     forwardRef(() => PaymentSvcModule),
  ],
  controllers: [
    SelectSeatController,
    UnSelectSeatController,
    GetRedisSeatController,
    GetOrdersByShowingIdController,
  ],
  providers: [
    // Services

    GetTotalTicketOfTicketTypeService,

    SelectSeatService,
    UnSelectSeatService,
    GetRedisSeatService,

    CountCheckedInTicketsService,
    CreateOrderService,
    GetPaidOrdersByShowingIdService,
    GetOrdersByShowingIdService,
    GetOrdersInShowingIdsService,
    GenerateTicketService,

    // Repositories
    { provide: 'OrderRepository', useClass: OrderRepositoryImpl },
    { provide: 'TicketRepository', useClass: TicketRepositoryImpl },
  ],
  exports: [
    GetTotalTicketOfTicketTypeService,
    CountCheckedInTicketsService, 
    GetRedisSeatService, 
    CreateOrderService,
    GetPaidOrdersByShowingIdService,
    GetOrdersInShowingIdsService,
    GenerateTicketService,
  ],
})
export class BookingSvcModule {}