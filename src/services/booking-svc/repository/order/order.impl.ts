import { Injectable, Inject } from "@nestjs/common"
import { Order, OrderRepository } from './order.repo'
import { PrismaBookingService } from "../../database/prisma-booking/prisma.service"
import { BaseBookingRepository } from "../base.repository"
import { Prisma } from "prisma/client-booking"
import { Result, Ok, Err } from "oxide.ts"
import { OrderData, TicketGroupedByTicketTypeID } from "../../modules/queries/getOrdersByShowingId/getOrdersByShowingId-response.dto"
import { GetPaymentInfoService } from "src/services/payment-svc/modules/queries/getPaymentInfo/getPaymentInfo.service"
import { GetFormResponseByIdService } from "src/services/event-svc/modules/formResponse/queries/getFormResponseById/getFormResponseById.service"
import { Pagination, PaginationQuery } from "src/shared/constants/pagination"

@Injectable()
export class OrderRepositoryImpl
  extends BaseBookingRepository<Order, Prisma.OrderDelegate>
  implements OrderRepository
  {
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
          createdAt: 'desc',
        }, (paginationQuery.page - 1) * paginationQuery.limit, paginationQuery.limit);

        if (!orders) {
          return Ok([[], null]);
        }

        let orderData: OrderData[] = [];
        for (const order of orders) {
          const formResponseId = order.formResponseId;
          const paymentInfoId = order.paymentId;

          const formResponse = await this.getFormResponseByIdService.execute(Number(formResponseId));
          if (formResponse.isErr()) {
            return Err(new Error(`Failed to get form response of order ${order.id}`));
          }

          const paymentInfo = await this.getPaymentInfoService.execute(paymentInfoId);
          if (paymentInfo.isErr()) {
            return Err(new Error(`Failed to get payment info of payment ${paymentInfoId}`));
          }

          const paymentInfoData = paymentInfo.unwrap();

          // Struct the ticket data group by ticket type
          // Re structure the tickets
          // const ticketsMapByTicketTypeId = new Map<string, TicketGroupedByTicketTypeID>();
          
          // count
          // for (const ticket of order.Ticket) {
          //   // Check if the ticket type already exists in the map
          //   // If not, fetch the ticket type details and add it to the map
          //   if (!ticketsMapByTicketTypeId.has(ticket.ticketTypeId)) {
          //     ticketsMapByTicketTypeId.set(ticket.ticketTypeId, {
          //       id: ticket.ticketTypeId,
          //       tickets: []
          //     });
          //   }

          //   ticketsMapByTicketTypeId.get(ticket.ticketTypeId)!.tickets.push({
          //     id: ticket.id,
          //     seatID: ticket.seatId,
          //     sectionID: ticket.sectionId,
          //     qrCode: ticket.qrCode,
          //     description: ticket.description,
          //   });
          // }
          orderData.push({
            id: order.id,
            status: order.status,
            price: order.price,
            type: order.type,
            mailSent: order.mailSent,
            showingId: order.showingId,
            userId: order.userId,
            formResponse: formResponse.unwrap(),
            paymentInfo: {
              id: paymentInfoData.id,
              method: paymentInfoData.method,
              paidAt: paymentInfoData.paidAt,
            },
            createdAt: order.createdAt,
            totalTicket: order.Ticket.length,
            // Ticket: Array.from(ticketsMapByTicketTypeId.values()),         
          });
        }

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
  }