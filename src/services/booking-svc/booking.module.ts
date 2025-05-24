import { Module } from "@nestjs/common";
import { OrderRepositoryImpl } from "./repository/order/order.impl";
import { TicketRepositoryImpl } from "./repository/ticket/ticket.impl";
import { SlackService } from "src/infrastructure/adapters/slack/slack.service";
import { GetTotalTicketOfTicketTypeService } from "./modules/queries/getTotalTicketOfTicketType/getTotalTicketOfTicketType.service";

@Module({
  controllers: [],
  providers: [
    // Adapters

    SlackService,

    // Services

    GetTotalTicketOfTicketTypeService,

    // Repositories
    { provide: 'OrderRepository', useClass: OrderRepositoryImpl },
    { provide: 'TicketRepository', useClass: TicketRepositoryImpl },
  ],
  exports: [GetTotalTicketOfTicketTypeService],
})
export class BookingSvcModule {}