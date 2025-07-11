import { Inject, Injectable } from "@nestjs/common";
import { Result, Ok, Err } from "oxide.ts";

import { BookingTicketStatus, OrderRepository } from "src/services/booking-svc/repository/order/order.repo";
import { OrderData } from "./getOrdersByShowingId-response.dto";
import { SlackService } from "src/infrastructure/adapters/slack/slack.service";
import { getShowingDetailService } from "src/services/event-svc/modules/showing/queries/getShowingDetail/getShowingDetail.service";
import { CheckUserExistService } from "src/services/auth-svc/modules/user/commands/checkuserExist/checkuserExist.service";
import { CheckUserPermissionService } from "src/services/event-svc/modules/event/commands/checkUserPermission/checkUserPermission.service";
import { EVENT_ROLE } from "src/services/event-svc/modules/event/domain/eventRole";
import { Pagination, PaginationQuery } from "src/shared/constants/pagination";
import { Ticket, TicketRepository } from "src/services/booking-svc/repository/ticket/ticket.repo";

@Injectable()
export class GetOrdersByShowingIdService {
  constructor(
    @Inject('OrderRepository') private readonly orderRepository: OrderRepository,
    @Inject('TicketRepository') private readonly ticketRepository: TicketRepository,
    private readonly slackService: SlackService,
    private readonly checkUserExistService: CheckUserExistService,
    private readonly getShowingDetailService: getShowingDetailService,
    private readonly checkUserPermissionService: CheckUserPermissionService,
  ) {}

  async execute(showingId: string, organizerId: string, paginationQuery: PaginationQuery, userEmail?: string): Promise<Result<[OrderData[], Pagination], Error>> {
    try {
      const showing = await this.getShowingDetailService.executeSimple(showingId);
      if (showing.isErr()) {
        return Err(new Error(showing.unwrapErr().message));
      }

      const userExists = await this.checkUserExistService.execute(organizerId);
      if (!userExists) {
        return Err(new Error('User does not exist'));
      }

      const canManage = await this.checkUserPermissionService.execute(showing.unwrap().eventId, organizerId, EVENT_ROLE.VIEW_ORDER, "get orders of showing");
      if (canManage.isErr()) {
        return Err(new Error(canManage.unwrapErr().message));
      }

      if (!canManage.unwrap()) {
        return Err(new Error('You do not have permisison to get orders of showing'));
      }

      const result = await this.orderRepository.getOrders(showingId, paginationQuery);
      if (result.isErr()) {
        return Err(new Error(result.unwrapErr().message));
      }

      return result;
    } catch (error) {
      await this.slackService.sendError(`Event Service - Orders of showing >>> GetOrdersByShowingIdService: ${error.message}`);

      return Err(new Error('Failed to get orders of showing'));
    }
  }

  async getAllTicketsByShowingId(showingId: string, email: string, pagination: PaginationQuery, orderId?: number): Promise<Result<[Ticket[], Pagination], Error>> {
    try {
      const showing = await this.getShowingDetailService.executeSimple(showingId);
      if (showing.isErr()) {
        return Err(new Error(showing.unwrapErr().message));
      }

      const userExists = await this.checkUserExistService.execute(email);
      if (!userExists) {
        return Err(new Error('User does not exist'));
      }

      const canManage = await this.checkUserPermissionService.execute(showing.unwrap().eventId, email, EVENT_ROLE.VIEW_ORDER, "get orders of showing");
      if (canManage.isErr()) {
        return Err(new Error(canManage.unwrapErr().message));
      }

      if (!canManage.unwrap()) {
        return Err(new Error('You do not have permisison to get orders of showing'));
      }

      var querySearch: any = {
        showingId: showingId,
        status: {
          in: [BookingTicketStatus.SUCCESS, BookingTicketStatus.PAID, BookingTicketStatus.CANCEL]
        }
      }

      if (orderId) {
        querySearch = {
            id: orderId,
            showingId: showingId,
        };
      }

      const totalTickets = await this.ticketRepository.count({
        Order: {
          is: querySearch
        }
      });

      const totalPages = Math.ceil(totalTickets / pagination.limit);

      const paginationResult: Pagination = {
        page: pagination.page,
        limit: pagination.limit,
        totalItems: totalTickets,
        totalPages: totalPages,
      };

      const tickets = await this.ticketRepository.findMany({ 
        Order: {
          is: querySearch
        }
      }, {
        qrCode: false,
        Order: true,
      }, {}, (pagination.page - 1) * pagination.limit, pagination.limit);

      return Ok([tickets, paginationResult]);
    } catch (error) {
      await this.slackService.sendError(`Event Service - Tickets of showing >>> GetAllTicketsByShowingIdService: ${error.message}`);
      return Err(new Error('Failed to get tickets of showing'));
    }
  }
}