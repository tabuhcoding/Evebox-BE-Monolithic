import { Inject, Injectable } from "@nestjs/common";
import { Result, Ok, Err } from "oxide.ts";
import { Order } from "src/services/booking-svc/repository/order/order.repo";

import { OrderRepository } from "src/services/booking-svc/repository/order/order.repo";
import { SlackService } from "src/infrastructure/adapters/slack/slack.service";
import { TicketRepository } from "src/services/booking-svc/repository/ticket/ticket.repo";

@Injectable()
export class GetOrdersWithTypeService {
  constructor(
    @Inject('OrderRepository') private readonly orderRepository: OrderRepository,
    @Inject('TicketRepository') private readonly ticketRepository: TicketRepository,
    private readonly slackService: SlackService,
  ) {}

  async execute(): Promise<Result<Record<string, number>, Error>> {
    try {
      const tickets = await this.ticketRepository.findMany({
        Order: {
          is: {
            status: {
              in: ["SUCCESS", "PAID"]
            }
          }
        },
        qrCode: { not: null }
      })

      const groupedTicketsMapping: Record<string, number> = {};
      await Promise.all(tickets.map(async (ticket) => {
        const ticketTypeId = ticket.ticketTypeId;
        if (!groupedTicketsMapping[ticketTypeId]) {
          groupedTicketsMapping[ticketTypeId] = 0;
        }
        groupedTicketsMapping[ticketTypeId] += 1;
      }));

      return Ok((groupedTicketsMapping));
    } catch (error) {
      await this.slackService.sendError(`Booking Svc >>> GetOrdersInShowingIdsService : ${error.message}`);
      return Err(new Error('Internal server error')); 
    }
  }
}