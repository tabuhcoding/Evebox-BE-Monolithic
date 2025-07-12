import { Inject, Injectable } from "@nestjs/common";
import { SlackService } from "src/infrastructure/adapters/slack/slack.service";
import { OrderRepository } from "src/services/booking-svc/repository/order/order.repo";
import { TicketRepository } from "src/services/booking-svc/repository/ticket/ticket.repo";
import { format } from 'date-fns';

@Injectable()
export class CalculateRevenueService {
  // Service methods go here
  constructor(
    @Inject('OrderRepository') private readonly orderRepository: OrderRepository,
    @Inject('TicketRepository') private readonly ticketRepository: TicketRepository,
    private readonly slackService: SlackService,
  ) {}

  async getAllDatesInOrder(): Promise<string[]> {
    const orders = await this.orderRepository.findAll({});
    
    const uniqueDays = Array.from(
      new Set(orders.map((item) => format(item.createdAt, 'yyyy-MM-dd')))
    );

    return uniqueDays;  
  }

  async getRevenueByDate(date: string): Promise<number> {
    const orders = await this.orderRepository.findAll({
      where: {
        createdAt: {
          gte: new Date(`${date}T00:00:00Z`),
          lt: new Date(`${date}T23:59:59Z`),
        },
      },
    });

    const totalRevenue = orders.reduce((sum, order) => sum + order.totalPrice, 0);
    return totalRevenue;
  }
}