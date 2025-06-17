import { Inject, Injectable } from '@nestjs/common';
import { Result, Ok, Err } from 'oxide.ts';
import { TicketWithTicketTypeDto, UserFormAnserDto, UserOrderDto } from './getUserOrder-response.dto';
import { SlackService } from 'src/infrastructure/adapters/slack/slack.service';
import { BookingTicketStatus, Order, OrderRepository } from 'src/services/booking-svc/repository/order/order.repo';
import { GetPaymentInfoService } from 'src/services/payment-svc/modules/queries/getPaymentInfo/getPaymentInfo.service';
import { GetPreviewShowingService } from 'src/services/event-svc/modules/showing/queries/getPreviewShowing/getPreviewShowing.service';
import { GetTicketTypeDetailService } from 'src/services/event-svc/modules/ticketType/queries/getTicketTypeDetail/getTicketTypeDetail.service';
import Hashids from 'hashids';
import { GetFormAnswerWithQuestionService } from 'src/services/event-svc/modules/formAnswer/queries/getFormAnswerWithQuestion/getFormAnswerWithQuestion.service';
import { OrderStatus, OrderTimeStamp } from './getUserOrder.dto';
import { Pagination, PaginationQuery } from 'src/shared/constants/pagination';

@Injectable()
export class GetUserOrderService {
  private hashids: Hashids;

  constructor(
    private readonly slackService: SlackService,
    private readonly paymentInfoService: GetPaymentInfoService,
    private readonly getPreviewShowingService: GetPreviewShowingService,
    private readonly getTicketTypeDetailService: GetTicketTypeDetailService,
    private readonly getFormAnswerWithQuestionService: GetFormAnswerWithQuestionService,
    @Inject('OrderRepository') private readonly orderRepository: OrderRepository,
  ) {
    this.hashids = new Hashids('evebox-salt', 12);
  }
  async execute(
    email: string,
    status: OrderStatus,
    paginationQuery: PaginationQuery
  ): Promise<Result<[UserOrderDto[], Pagination], Error>> {
    try {
      // count
      const totalOrders = await this.orderRepository.count({
        userId: email,
        status: (
          status == OrderStatus.PENDING ? BookingTicketStatus.PAID :
          status == OrderStatus.SUCCESS ? BookingTicketStatus.SUCCESS :
          status == OrderStatus.CANCELLED ? BookingTicketStatus.CANCEL : {
            not: BookingTicketStatus.PENDING
          }
        )
      });
      // pagination
      const pagination: Pagination = {
        page: paginationQuery.page >> 0 || 1,
        limit: paginationQuery.limit >> 0 || 10,
        totalItems: totalOrders,
        totalPages: Math.ceil(totalOrders / (paginationQuery.limit >> 0 || 10)),
      };

      const orders = await this.orderRepository.findMany({
        userId: email,
        status: (
          status == OrderStatus.PENDING ? BookingTicketStatus.PAID :
          status == OrderStatus.SUCCESS ? BookingTicketStatus.SUCCESS :
          status == OrderStatus.CANCELLED ? BookingTicketStatus.CANCEL : {
            not: BookingTicketStatus.PENDING
          }
        )
      }, {
          Ticket: true,
      },{
        createdAt: 'desc',
      }, (paginationQuery.page - 1) * paginationQuery.limit,
        paginationQuery.limit
      )

      if (!orders || orders.length === 0) {
        return Ok([[], { page: paginationQuery.page, limit: paginationQuery.limit, totalPages: 0, totalItems: 0 }]);
      }

      const mappedOrders = await Promise.all(orders.map(async order => {
        // Get payment info for each order
        const paymentInfo = await this.paymentInfoService.getPaymentInfoByOrderId(order.id);
        
        // Get showing details for each order
        const showing = await this.getPreviewShowingService.execute(order.showingId);

        // Re structure the tickets
        const ticketsMapByTicketTypeId = new Map<string, TicketWithTicketTypeDto>();
        
        // count
        for (const ticket of order.Ticket) {
          if (!ticketsMapByTicketTypeId.has(ticket.ticketTypeId)) {
            const ticketTypeDetail = await this.getTicketTypeDetailService.getTicketTypeDetail(ticket.ticketTypeId);
            ticketsMapByTicketTypeId.set(ticket.ticketTypeId, {
              id: ticketTypeDetail.id,
              name: ticketTypeDetail.name,
              description: ticketTypeDetail.description,
              price: ticketTypeDetail.price,
              tickets: []
            });
          }

          let seatname: string | null = null;
          let sectionname: string | null = null;

          if (ticket.seatId) {
            [seatname, sectionname] = await this.getTicketTypeDetailService.getSeatSectionName(ticket.ticketTypeId, ticket.seatId);
          } else if (ticket.sectionId) {
            sectionname = await this.getTicketTypeDetailService.getTicketTypeSectionname(ticket.ticketTypeId, ticket.sectionId);
          }

          ticketsMapByTicketTypeId.get(ticket.ticketTypeId)!.tickets.push({
            id: ticket.id,
            seatname,
            sectionname,
            description: ticket.description,
          });
        }


        return {
          id: this.hashids.encode(order.id),
          showingId: order.showingId,
          type: order.type,
          price: order.totalPrice,
          status: (
            order.status === BookingTicketStatus.PAID ? OrderStatus.PENDING :
            order.status === BookingTicketStatus.SUCCESS ? OrderStatus.SUCCESS :
            order.status === BookingTicketStatus.CANCEL ? OrderStatus.CANCELLED :
            OrderStatus.PENDING
          ),
          createdAt: order.createdAt,
          PaymentInfo: paymentInfo ? {
            method: paymentInfo.method,
            paidAt: paymentInfo.paidAt,
          } : undefined,
          Showing: showing,
          Ticket: Array.from(ticketsMapByTicketTypeId.values()),
          count: order.Ticket.length,
        };
      }));
      

      return Ok([mappedOrders, pagination]);
    } catch (error) {
      await this.slackService.sendError(`Error in GetUserTicketService: ${error.message}`);

      return Err(new Error('Failed to select seat'));
    }
  }

  async executeByOrderId(orderId: string, email: string): Promise<Result<UserOrderDto, Error>> {
    try {
      const id = this.decodeId(orderId);

      if(!id) {
        return Err(new Error('Invalid order ID'));
      }

      const order = await this.orderRepository.findOne({
        id: id,
        status: {
          not: BookingTicketStatus.PENDING
        }
      }, {
        Ticket: true,
      });

      if (!order || order.status === BookingTicketStatus.PENDING) {
        return Err(new Error('Order not found'));
      }

      if (order.userId !== email) {
        return Err(new Error('Unauthorized access to this order'));
      }

      // Get payment info for the order
      const paymentInfo = await this.paymentInfoService.getPaymentInfoByOrderId(order.id);
      // Get showing details for the order
      const showing = await this.getPreviewShowingService.execute(order.showingId);
      // Re structure the tickets
      const ticketsMapByTicketTypeId = new Map<string, TicketWithTicketTypeDto>();
      // Get form response for order
      var formResponses : UserFormAnserDto[] = [];
      if (order.formResponseId) {
        formResponses = await this.getFormAnswerWithQuestionService.execute(order.formResponseId);
      }
      // count
      for (const ticket of order.Ticket) {
        if (!ticketsMapByTicketTypeId.has(ticket.ticketTypeId)) {
          const ticketTypeDetail = await this.getTicketTypeDetailService.getTicketTypeDetail(ticket.ticketTypeId);
          ticketsMapByTicketTypeId.set(ticket.ticketTypeId, {
            id: ticketTypeDetail.id,
            name: ticketTypeDetail.name,
            description: ticketTypeDetail.description,
            price: ticketTypeDetail.price,
            tickets: []
          });
        }

        let seatname: string | null = null;
        let sectionname: string | null = null;

        if (ticket.seatId) {
          [seatname, sectionname] = await this.getTicketTypeDetailService.getSeatSectionName(ticket.ticketTypeId, ticket.seatId);
        } else if (ticket.sectionId) {
          sectionname = await this.getTicketTypeDetailService.getTicketTypeSectionname(ticket.ticketTypeId, ticket.sectionId);
        }

        ticketsMapByTicketTypeId.get(ticket.ticketTypeId)!.tickets.push({
          id: ticket.id,
          seatname,
          sectionname,
          description: ticket.description,
        });
      }

      const userOrder: UserOrderDto = {
        id: this.hashids.encode(order.id),
        showingId: order.showingId,
        status: (
          order.status === BookingTicketStatus.PAID ? OrderStatus.PENDING :
          order.status === BookingTicketStatus.SUCCESS ? OrderStatus.SUCCESS :
          order.status === BookingTicketStatus.CANCEL ? OrderStatus.CANCELLED :
          OrderStatus.PENDING
        ),
        type: order.type,
        price: order.totalPrice,
        createdAt: order.createdAt,
        PaymentInfo: paymentInfo ? {
          method: paymentInfo.method,
          paidAt: paymentInfo.paidAt,
        } : undefined,
        Showing: showing,
        Ticket: Array.from(ticketsMapByTicketTypeId.values()),
        count: order.Ticket.length,
        formResponse: formResponses,
      };

      return Ok(userOrder);
    }
    catch (error) {
      await this.slackService.sendError(`Error in GetUserOrderByIdService: ${error.message}`);
      
      return Err(new Error('Failed to select seat'));
    }
  }

  async executeByOriginalOrderIdWithoutCheck(originalOrderId: number): Promise<[UserOrderDto, string] | null>{
    try {
      var order : Order | null = null;
      var count = 0;
      var max_count = 10;

      do {
        order = await this.orderRepository.findOne({
          id: originalOrderId,
          status: {
            not: BookingTicketStatus.PENDING
          },
        }, {
        Ticket: true,
        });

        if (!order) {
          return null;
        }

        if ( count >= max_count ||
          (order.status === BookingTicketStatus.PENDING && count > 3)){
          const showing = await this.getPreviewShowingService.execute(order.showingId);
          
          return ([{
            id: this.hashids.encode(order.id),
            showingId: order.showingId,
            status: OrderStatus.PENDING,
            type: order.type,
            price: order.totalPrice,
            createdAt: order.createdAt,
            PaymentInfo: undefined,
            Ticket: [],
            Showing: showing,
          }, order.userId]);
        }

        if (order.status === BookingTicketStatus.CANCEL || order.status === BookingTicketStatus.SUCCESS) {
          break;
        }

        await new Promise(resolve => setTimeout(resolve, 15000));
        count++;
      } while (order.status === BookingTicketStatus.PENDING || BookingTicketStatus.PAID)

      // Get payment info for the order
      const paymentInfo = await this.paymentInfoService.getPaymentInfoByOrderId(order.id);
      // Get showing details for the order
      const showing = await this.getPreviewShowingService.execute(order.showingId);
      // Re structure the tickets
      const ticketsMapByTicketTypeId = new Map<string, TicketWithTicketTypeDto>();
      // Get form response for order
      var formResponses : UserFormAnserDto[] = [];
      if (order.formResponseId) {
        formResponses = await this.getFormAnswerWithQuestionService.execute(order.formResponseId);
      }
      // count
      for (const ticket of order.Ticket) {
        if (!ticketsMapByTicketTypeId.has(ticket.ticketTypeId)) {
          const ticketTypeDetail = await this.getTicketTypeDetailService.getTicketTypeDetail(ticket.ticketTypeId);
          ticketsMapByTicketTypeId.set(ticket.ticketTypeId, {
            id: ticketTypeDetail.id,
            name: ticketTypeDetail.name,
            description: ticketTypeDetail.description,
            price: ticketTypeDetail.price,
            tickets: []
          });
        }

        let seatname: string | null = null;
        let sectionname: string | null = null;

        if (ticket.seatId) {
          [seatname, sectionname] = await this.getTicketTypeDetailService.getSeatSectionName(ticket.ticketTypeId, ticket.seatId);
        } else if (ticket.sectionId) {
          sectionname = await this.getTicketTypeDetailService.getTicketTypeSectionname(ticket.ticketTypeId, ticket.sectionId);
        }

        ticketsMapByTicketTypeId.get(ticket.ticketTypeId)!.tickets.push({
          id: ticket.id,
          seatname,
          sectionname,
          description: ticket.description,
          qrcode: ticket.qrCode,
        });
      }


      const userOrder: UserOrderDto = {
        id: this.hashids.encode(order.id),
        showingId: order.showingId,
        status: (
          order.status === BookingTicketStatus.PAID ? OrderStatus.PENDING :
          order.status === BookingTicketStatus.SUCCESS ? OrderStatus.SUCCESS :
          order.status === BookingTicketStatus.CANCEL ? OrderStatus.CANCELLED :
          OrderStatus.PENDING
        ),
        type: order.type,
        price: order.totalPrice,
        PaymentInfo: paymentInfo ? {
          method: paymentInfo.method,
          paidAt: paymentInfo.paidAt,
        } : undefined,
        Showing: showing,
        Ticket: Array.from(ticketsMapByTicketTypeId.values()),
        count: order.Ticket.length,
        formResponse: formResponses,
      };

      return ([userOrder, order.userId]);
    }
    catch (error) {
      await this.slackService.sendError(`Error in GetUserTicketByOriginalService: ${error.message}`);
      
      return null;
    }
  }

  async executeByOriginalOrderId(originalOrderId: number, email: string): Promise<Result<UserOrderDto, Error>> {
      try {
      var order : Order | null = null;
      var count = 0;
      var max_count = 10;

      do {
        order = await this.orderRepository.findOne({
          id: originalOrderId,
          status: {
            not: BookingTicketStatus.PENDING
          },
        }, {
        Ticket: true,
        });

        if (!order) {
          return Err(new Error('Order not found'));
        }

        if (order.userId !== email) {
          return Err(new Error('Unauthorized access to this order'));
        }

        if ( count >= max_count ||
          (order.status === BookingTicketStatus.PENDING && count > 3)){
          const showing = await this.getPreviewShowingService.execute(order.showingId);
          
          return Ok({
            id: this.hashids.encode(order.id),
            showingId: order.showingId,
            status: OrderStatus.PENDING,
            type: order.type,
            price: order.totalPrice,
            createdAt: order.createdAt,
            PaymentInfo: undefined,
            Ticket: [],
            Showing: showing,
          });
        }

        if (order.status === BookingTicketStatus.CANCEL || order.status === BookingTicketStatus.SUCCESS) {
          break;
        }

        await new Promise(resolve => setTimeout(resolve, 15000));
        count++;
      } while (order.status === BookingTicketStatus.PENDING || BookingTicketStatus.PAID)

      // Get payment info for the order
      const paymentInfo = await this.paymentInfoService.getPaymentInfoByOrderId(order.id);
      // Get showing details for the order
      const showing = await this.getPreviewShowingService.execute(order.showingId);
      // Re structure the tickets
      const ticketsMapByTicketTypeId = new Map<string, TicketWithTicketTypeDto>();
      // Get form response for order
      var formResponses : UserFormAnserDto[] = [];
      if (order.formResponseId) {
        formResponses = await this.getFormAnswerWithQuestionService.execute(order.formResponseId);
      }
      // count
      for (const ticket of order.Ticket) {
        if (!ticketsMapByTicketTypeId.has(ticket.ticketTypeId)) {
          const ticketTypeDetail = await this.getTicketTypeDetailService.getTicketTypeDetail(ticket.ticketTypeId);
          ticketsMapByTicketTypeId.set(ticket.ticketTypeId, {
            id: ticketTypeDetail.id,
            name: ticketTypeDetail.name,
            description: ticketTypeDetail.description,
            price: ticketTypeDetail.price,
            tickets: []
          });
        }

        let seatname: string | null = null;
        let sectionname: string | null = null;

        if (ticket.seatId) {
          [seatname, sectionname] = await this.getTicketTypeDetailService.getSeatSectionName(ticket.ticketTypeId, ticket.seatId);
        } else if (ticket.sectionId) {
          sectionname = await this.getTicketTypeDetailService.getTicketTypeSectionname(ticket.ticketTypeId, ticket.sectionId);
        }

        ticketsMapByTicketTypeId.get(ticket.ticketTypeId)!.tickets.push({
          id: ticket.id,
          seatname,
          sectionname,
          description: ticket.description,
        });
      }


      const userOrder: UserOrderDto = {
        id: this.hashids.encode(order.id),
        showingId: order.showingId,
        status: (
          order.status === BookingTicketStatus.PAID ? OrderStatus.PENDING :
          order.status === BookingTicketStatus.SUCCESS ? OrderStatus.SUCCESS :
          order.status === BookingTicketStatus.CANCEL ? OrderStatus.CANCELLED :
          OrderStatus.PENDING
        ),
        type: order.type,
        price: order.totalPrice,
        PaymentInfo: paymentInfo ? {
          method: paymentInfo.method,
          paidAt: paymentInfo.paidAt,
        } : undefined,
        Showing: showing,
        Ticket: Array.from(ticketsMapByTicketTypeId.values()),
        count: order.Ticket.length,
        formResponse: formResponses,
      };

      return Ok(userOrder);
    }
    catch (error) {
      await this.slackService.sendError(`Error in GetUserTicketByOriginalService: ${error.message}`);
      
      return Err(new Error('Failed to select seat'));
    }
  }
  decodeId(hash: string): number {
    const [id] = this.hashids.decode(hash) as number[];
    if (typeof id !== 'number') return null;
    return id;
  }
}