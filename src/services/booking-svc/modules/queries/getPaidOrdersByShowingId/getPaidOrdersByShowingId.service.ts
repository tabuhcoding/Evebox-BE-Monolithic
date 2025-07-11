import { Inject, Injectable } from "@nestjs/common";
import { OrderRepository } from "src/services/booking-svc/repository/order/order.repo";
import { SlackService } from "src/infrastructure/adapters/slack/slack.service";
import { Result, Ok } from "oxide.ts";
import { Order } from "../../../repository/order/order.repo";
import { BookingTicketStatus } from 'src/services/booking-svc/repository/order/order.repo';

@Injectable()
export class GetPaidOrdersByShowingIdService {
  constructor(
    @Inject('OrderRepository') private readonly orderRepository: OrderRepository, // Replace 'any' with the actual type of OrderRepository
    private readonly slackService: SlackService,
  ) {}

  async execute(showingId: string): Promise<Result<Order[], Error>> {
    try {
      const orders = await this.orderRepository.findMany({
        OR: [
          { status: BookingTicketStatus.PAID },
          { status: BookingTicketStatus.SUCCESS },
        ],
        showingId
      }, {
        Ticket: true,
      });

      return Ok(orders);
    } catch (error) {
      await this.slackService.sendError(` Booking Svc >>> GetOrdersByShowingIdService : ${error.message}`)

      return null;
    }
  }

  async executeWithMultipleShowings(showingIds: string[], fromDate?: Date, toDate?: Date): Promise<Order[] | null> {
    try {
      const orders = await this.orderRepository.findMany({
        OR: [
          { status: BookingTicketStatus.PAID },
          { status: BookingTicketStatus.SUCCESS },
        ],
        showingId: { in: showingIds },
        ...(fromDate && { createdAt: { gte: fromDate } }),
        ...(toDate && { createdAt: { lte: toDate } }),
      }, {
        Ticket: true,
      });

      return (orders);
    } catch (error) {
      await this.slackService.sendError(` Booking Svc >>> GetOrdersByShowingIdService : ${error.message}`)

      return null;
    }
  }
}