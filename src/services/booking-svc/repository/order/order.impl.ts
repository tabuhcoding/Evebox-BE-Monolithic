import { Injectable, Inject } from "@nestjs/common"
import { Order, OrderRepository } from './order.repo'
import { PrismaService } from "src/infrastructure/database/prisma/prisma.service"
import { BaseRepository } from "src/shared/repo/base.repository"
import { Prisma } from "@prisma/client"
import { Result, Ok, Err } from "oxide.ts"
import { OrderData, TicketGroupedByTicketTypeID } from "../../modules/queries/getOrdersByShowingId/getOrdersByShowingId-response.dto"
import { GetPaymentInfoService } from "src/services/payment-svc/modules/queries/getPaymentInfo/getPaymentInfo.service"
import { GetFormResponseByIdService } from "src/services/event-svc/modules/formResponse/queries/getFormResponseById/getFormResponseById.service"

@Injectable()
export class OrderRepositoryImpl
  extends BaseRepository<Order, Prisma.OrderDelegate>
  implements OrderRepository
  {
    constructor(
      protected readonly prisma: PrismaService,
      private readonly getPaymentInfoService: GetPaymentInfoService,
      private readonly getFormResponseByIdService: GetFormResponseByIdService,
    ) {
      super(prisma.order, prisma)
    }

    async getOrders(showingId: string): Promise<Result<OrderData[], Error>> {
      try {
        const orders = await this.findMany({
          showingId
        });

        if (!orders) {
          return Ok([]);
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
        const ticketsMapByTicketTypeId = new Map<string, TicketGroupedByTicketTypeID>();
        
        // count
        await Promise.all(order.Ticket.map(async ticket => {
          
          // Check if the ticket type already exists in the map
          // If not, fetch the ticket type details and add it to the map
          if (!ticketsMapByTicketTypeId.has(ticket.ticketTypeId)) {
            ticketsMapByTicketTypeId.set(ticket.ticketTypeId, {
              id: ticket.ticketTypeId,
              tickets: []
            });
          }
          ticketsMapByTicketTypeId.get(ticket.ticketTypeId)!.tickets.push({
            id: ticket.id,
            seatID: ticket.seatId,
            sectionID: ticket.sectionId,
            qrCode: ticket.qrCode,
            description: ticket.description,
          });
          }));
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
            Ticket: Array.from(ticketsMapByTicketTypeId.values()),         
          });
        }

        return Ok(orderData);
      } catch (error) {
        return Err(new Error('Failed to get orders of showing'));
      }
    }
  }