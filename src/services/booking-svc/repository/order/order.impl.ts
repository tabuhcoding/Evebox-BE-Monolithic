import { Injectable, Inject } from "@nestjs/common"
import { Order, OrderRepository } from './order.repo'
import { PrismaBookingService } from "../../database/prisma-booking/prisma.service"
import { BaseBookingRepository } from "../base.repository"
import { Prisma, BookingTicketStatus } from "prisma/client-booking"
import { Result, Ok, Err } from "oxide.ts"
import { OrderData, TicketGroupedByTicketTypeID } from "../../modules/queries/getOrdersByShowingId/getOrdersByShowingId-response.dto"
import { GetPaymentInfoService } from "src/services/payment-svc/modules/queries/getPaymentInfo/getPaymentInfo.service"
import { GetFormResponseByIdService } from "src/services/event-svc/modules/formResponse/queries/getFormResponseById/getFormResponseById.service"
import { Pagination, PaginationQuery } from "src/shared/constants/pagination"

@Injectable()
export class OrderRepositoryImpl
  extends BaseBookingRepository<Order, Prisma.OrderDelegate>
  implements OrderRepository {
  constructor(
    protected readonly prisma: PrismaBookingService,
    private readonly getPaymentInfoService: GetPaymentInfoService,
    private readonly getFormResponseByIdService: GetFormResponseByIdService,
  ) {
    super(prisma.order, prisma)
  }

    async getOrders(showingId: string, paginationQuery: PaginationQuery, userEmail?: string): Promise<Result<[OrderData[], Pagination], Error>> {
      try {
        var filterQuery: any = {
          showingId,
          status: {
            not: BookingTicketStatus.PENDING
          },
        }
        if (userEmail) {
          filterQuery.userId = userEmail;
        }
        // count the total number of orders for pagination
        const totalOrders = await this.count(filterQuery);
        
        const totalPages = Math.ceil(totalOrders / paginationQuery.limit);

        const orders = await this.findMany(filterQuery, {
          Ticket: true,
        }, {
          id: 'desc',
        }, (paginationQuery.page - 1) * paginationQuery.limit, paginationQuery.limit);


      if (!orders) {
        return Ok([[], null]);
      }

      let paymentIds = []
      let formResponseIds = []
      orders.forEach(order => {
        if (order.paymentId) {
          paymentIds.push(order.paymentId);
        }
        if (order.formResponseId) {
          formResponseIds.push(order.formResponseId);
        }
      });
      
      const paymentInfos = await this.getPaymentInfoService.executeMany(paymentIds);
      if (paymentInfos.isErr()) {
        return Err(new Error(paymentInfos.unwrapErr().message));
      }
      const formResponses = await this.getFormResponseByIdService.executeMany(formResponseIds);
      if (formResponses.isErr()) {
        return Err(new Error(formResponses.unwrapErr().message));
      }

      const paymentInfosResult = paymentInfos.unwrap();
      const formResponsesResult = formResponses.unwrap();

      let orderData: OrderData[] = [];
      orders.forEach(order => {
        const paymentInfo = paymentInfosResult.get(order.id) || null;
        const formResponse = formResponsesResult.get(order.id) || null;

        orderData.push({
          id: order.id,
          status: order.status,
          price: order.price,
          type: order.type,
          mailSent: order.mailSent,
          showingId: order.showingId,
          userId: order.userId,
          ownerId: order.ownerId || order.userId, // If ownerId is not set, use userId
          formResponse: formResponse,
          paymentInfo: paymentInfo ? {
            id: paymentInfo.id,
            method: paymentInfo.method,
            paidAt: paymentInfo.paidAt,
          }: null,
          createdAt: order.createdAt,
          totalTicket: order.Ticket.length,
          // Ticket: Array.from(ticketsMapByTicketTypeId.values()),         
        });
      });

      console.log(`Retrieved ${orderData.length} orders for showing ${showingId}`);

      return Ok([orderData, {
        page: paginationQuery.page,
        limit: paginationQuery.limit,
        totalItems: totalOrders,
        totalPages: totalPages,
      }]);
    } catch (error) {
      console.error(`Error in OrderRepositoryImpl.getOrders: ${error.message}`);
      return Err(new Error('Failed to get orders of showing'));
    }
  }

  async getAllSuccessOrders(): Promise<Order[]> {
    try {
      const orders = await this.findMany({
        paymentId: { not: null },
        status: {
          in: [BookingTicketStatus.SUCCESS, BookingTicketStatus.PAID]
        },
      }, {
        Ticket: true,
      });
      return orders;
    } catch (error) {
      throw new Error('Failed to get all orders');
    }
  }
}