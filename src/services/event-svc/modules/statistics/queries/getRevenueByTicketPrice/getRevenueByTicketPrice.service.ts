import { Inject, Injectable } from "@nestjs/common";
import { Result, Err, Ok } from "oxide.ts";
import { EventsRepository } from "src/services/event-svc/repository/events/events.repo";
import { GetAdminAccessService } from "src/services/auth-svc/modules/user/queries/get-admin-access/get-admin-access.service";
import { GetOrdersWithTypeService } from "src/services/booking-svc/modules/queries/getOrdersWithType/getOrdersWithType.service";
import { SlackService } from "src/infrastructure/adapters/slack/slack.service";
import { RevenueByTicketPriceData } from "./getRevenueByTicketPrice-response.dto";

@Injectable()
export class GetRevenueByTicketPriceService {
  constructor(
    @Inject('EventsRepository') private readonly eventsRepository: EventsRepository,
    private readonly getAdminAccessService: GetAdminAccessService,
    private readonly slackService: SlackService,
    private readonly getOrdersWithTypeService: GetOrdersWithTypeService,
  ) {}

  async execute(email: string): Promise<Result<RevenueByTicketPriceData[], Error>> {
    try {
      const isAdmin = await this.getAdminAccessService.execute(email);
      if (!isAdmin) return Err(new Error('You do not have permission to get organizer revenue'));

      const ticketTypes = await this.eventsRepository.getAllTicketTypes();

      const ordersResult = await this.getOrdersWithTypeService.execute();
      if (ordersResult.isErr()) {
        return Err(new Error(ordersResult.unwrapErr().message));
      }

      const orders = ordersResult.unwrap();

      const result: RevenueByTicketPriceData[] = [];

      for (const ticketType of ticketTypes) {
        const matchedTickets = orders.filter(order =>
          order.Ticket.some(ticket => ticket.ticketTypeId === ticketType.id)
        )

        const sold = matchedTickets.length;
        const total = ticketType.quantity || 0;
        const revenue = matchedTickets.reduce((sum, order) => sum + order.price, 0)

        result.push({
          price: ticketType.price,
          total,
          sold,
          conversionRate: total ? sold / total : 0,
          revenue,
        });
      }

      return Ok(result);
    } catch (error) {
      await this.slackService.sendError(`Event Service - Admin - Statistics >>> GetOrgRevenueByTicketPriceService: ${error.message}`);
      return Err(new Error('Internal server error'));
    }
  }
}