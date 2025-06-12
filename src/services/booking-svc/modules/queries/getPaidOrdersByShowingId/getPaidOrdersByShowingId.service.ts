import { Inject, Injectable } from "@nestjs/common";
import { OrderRepository } from "src/services/booking-svc/repository/order/order.repo";
import { SlackService } from "src/infrastructure/adapters/slack/slack.service";
import { Result, Ok } from "oxide.ts";
import { Order } from "@prisma/client";

@Injectable()
export class GetPaidOrdersByShowingIdService {
  constructor(
    @Inject('OrderRepository') private readonly orderRepository: OrderRepository, // Replace 'any' with the actual type of OrderRepository
    private readonly slackService: SlackService,
  ) {}

  async execute(showingId: string): Promise<Result<Order[], Error>> {
    try {
      const orders = await this.orderRepository.findMany({
        status: "PAID",
        showingId
      });

      return Ok(orders);
    } catch (error) {
      await this.slackService.sendError(` Booking Svc >>> GetOrdersByShowingIdService : ${error.message}`)

      return null;
    }
  }
}