import { Inject, Injectable } from "@nestjs/common";
import { Result, Ok, Err } from "oxide.ts";
import { Order } from "@prisma/client";

import { OrderRepository } from "src/services/booking-svc/repository/order/order.repo";
import { SlackService } from "src/infrastructure/adapters/slack/slack.service";

@Injectable()
export class GetOrdersInShowingIdsService {
  constructor(
    @Inject('OrderRepository') private readonly orderRepository: OrderRepository, // Replace 'any' with the actual type of OrderRepository
    private readonly slackService: SlackService,
  ) {}

  async execute(showingIds: string[]): Promise<Result<Order[], Error>> {
    try {
      const totalOrders = await this.orderRepository.findMany({
        showingId: {
          in: showingIds
        }
      });

      return Ok(totalOrders);
    } catch (error) {
      this.slackService.sendError(` Booking Svc >>> GetOrdersInShowingIdsService : ${error.message}`)

      return null;
    }
  }
}