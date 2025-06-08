import { Injectable, Inject } from "@nestjs/common"
import { Order, OrderRepository } from './order.repo'
import { PrismaService } from "src/infrastructure/database/prisma/prisma.service"
import { BaseRepository } from "src/shared/repo/base.repository"
import { Prisma } from "@prisma/client"
import { Result, Ok, Err } from "oxide.ts"
import { OrderData } from "../../modules/queries/getOrdersByShowingId/getOrdersByShowingId-response.dto"
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

          orderData.push({
            id: order.id,
            status: order.status,
            price: order.price,
            type: order.type,
            mailSent: order.mailSent,
            showingId: order.showingId,
            userId: order.userId,
            formResponse: formResponse.unwrap(),
            paymentInfo: paymentInfo.unwrap(),         
          });
        }

        return Ok(orderData);
      } catch (error) {
        return Err(new Error('Failed to get orders of showing'));
      }
    }
  }