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
import { SubmitFormController } from "./modules/commands/submitForm/submitForm.controller";
import { SubmitFormService } from "./modules/commands/submitForm/submitForm.service";
import { TicketQueryService } from "./modules/queries/getTicketQuery/ticket-query.service";
import { GenerateTicketService } from "./modules/commands/generateTicket/generateTicket.service";
import { GenerateQrcodeService } from "./modules/commands/generateQrcode/generateQrcode.service";
import { RecheckOrderMissedService } from "./modules/commands/recheckOrderMissed/recheckOrderMissed.service";
import { GetUserOrderController } from "./modules/queries/getUserOrder/getUserOrder.controller";
import { GetUserOrderService } from "./modules/queries/getUserOrder/getUserOrder.service";
import { GetTicketQrCodeController } from "./modules/queries/getTicketQrCode/getTicketQrCode.controller";
import { GetTicketQrCodeService } from "./modules/queries/getTicketQrCode/getTicketQrCode.service";
import { EmailModule } from "src/infrastructure/adapters/email/email.module";
import { PrismaBookingModule } from "./database/prisma-booking/prisma.module";

@Module({
  imports: [ 
     forwardRef(() => AuthSvcModule),
     forwardRef(() => EventSvcModule),
     forwardRef(() => PaymentSvcModule),
     EmailModule,
     PrismaBookingModule,
  ],
  controllers: [
    SelectSeatController,
    UnSelectSeatController,
    GetRedisSeatController,
    GetOrdersByShowingIdController,
    SubmitFormController,
    GetUserOrderController,
    GetTicketQrCodeController,
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
    TicketQueryService,
    GenerateTicketService,
    GenerateQrcodeService,
    RecheckOrderMissedService,
    GetUserOrderService,
    GetTicketQrCodeService,

    SubmitFormService,

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
    GenerateQrcodeService,
    RecheckOrderMissedService,
    TicketQueryService
  ],
})
export class BookingSvcModule {}