import { Inject, Injectable } from "@nestjs/common";
import { Result, Ok, Err } from "oxide.ts";
import { Order } from "src/services/booking-svc/repository/order/order.repo";

import { OrderRepository } from "src/services/booking-svc/repository/order/order.repo";
import { SlackService } from "src/infrastructure/adapters/slack/slack.service";

@Injectable()
export class GetOrdersWithTypeService {
  constructor(
    @Inject('OrderRepository') private readonly orderRepository: OrderRepository,
    private readonly slackService: SlackService,
  ) {}

  async execute(): Promise<Result<Order[], Error>> {
    try {
      const totalOrders = await this.orderRepository.getAllSuccessOrders();
      if (!totalOrders) {
        return Ok([]);
      }

      return Ok(totalOrders);
    } catch (error) {
      await this.slackService.sendError(`Booking Svc >>> GetOrdersInShowingIdsService : ${error.message}`);
      return Err(new Error('Internal server error'));
    }
  }
}