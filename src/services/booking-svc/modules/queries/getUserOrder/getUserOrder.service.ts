import { Inject, Injectable } from '@nestjs/common';
import { Result, Ok, Err } from 'oxide.ts';
import { TicketWithTicketTypeDto, UserFormAnserDto, UserOrderDto } from './getUserOrder-response.dto';
import { SlackService } from 'src/infrastructure/adapters/slack/slack.service';
import { OrderRepository } from 'src/services/booking-svc/repository/order/order.repo';
import { GetPaymentInfoService } from 'src/services/payment-svc/modules/queries/getPaymentInfo/getPaymentInfo.service';
import { GetPreviewShowingService } from 'src/services/event-svc/modules/showing/queries/getPreviewShowing/getPreviewShowing.service';
import { GetTicketTypeDetailService } from 'src/services/event-svc/modules/ticketType/queries/getTicketTypeDetail/getTicketTypeDetail.service';
import Hashids from 'hashids';
import { GetFormAnswerWithQuestionService } from 'src/services/event-svc/modules/formAnswer/queries/getFormAnswerWithQuestion/getFormAnswerWithQuestion.service';

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
  async execute(email: string): Promise<Result<UserOrderDto[], Error>> {
    try {
      const orders = await this.orderRepository.findAll({
        userId: email,
      }, {
          Ticket: true,
      })

      if (!orders || orders.length === 0) {
        return Ok([]);
      }

      const mappedOrders = await Promise.all(orders.map(async order => {
        // Get payment info for each order
        const paymentInfo = await this.paymentInfoService.getPaymentInfoByOrderId(order.id);
        
        // Get showing details for each order
        const showing = await this.getPreviewShowingService.execute(order.showingId);

        // Re structure the tickets
        const ticketsMapByTicketTypeId = new Map<string, TicketWithTicketTypeDto>();
        
        // count
        await Promise.all(order.Ticket.map(async ticket => {
          
          // Check if the ticket type already exists in the map
          // If not, fetch the ticket type details and add it to the map
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
          var seatname = null;
          var sectionname = null;

          if(ticket.sectionId){
            sectionname = await this.getTicketTypeDetailService.getTicketTypeSectionname(ticket.ticketTypeId, ticket.sectionId);
          }

          if(ticket.seatId){
            [seatname, sectionname] = await this.getTicketTypeDetailService.getSeatSectionName(ticket.ticketTypeId, ticket.seatId);
          }
          // Fetch the seatname or section name based on the ticket type
          ticketsMapByTicketTypeId.get(ticket.ticketTypeId)!.tickets.push({
            id: ticket.id,
            seatname: seatname,
            sectionname: sectionname,
            qrCode: ticket.qrCode,
            description: ticket.description,
          });
        }));

        return {
          id: this.hashids.encode(order.id),
          showingId: order.showingId,
          status: order.status,
          type: order.type,
          price: order.totalPrice,
          PaymentInfo: paymentInfo ? {
            method: paymentInfo.method,
            paidAt: paymentInfo.paidAt,
          } : undefined,
          Showing: showing,
          Ticket: Array.from(ticketsMapByTicketTypeId.values()),
          count: order.Ticket.length,
        };
      }));
      

      return Ok(mappedOrders);
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

      const order = await this.orderRepository.findOneById(id, {
        Ticket: true,
      });

      if (!order) {
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
      await Promise.all(order.Ticket.map(async ticket => {
        // Check if the ticket type already exists in the map
        // If not, fetch the ticket type details and add it to the map
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
        var seatname = null;
        var sectionname = null;

        if(ticket.sectionId){
          sectionname = await this.getTicketTypeDetailService.getTicketTypeSectionname(ticket.ticketTypeId, ticket.sectionId);
        }

        if(ticket.seatId){
          [seatname, sectionname] = await this.getTicketTypeDetailService.getSeatSectionName(ticket.ticketTypeId, ticket.seatId);
        }
        // Fetch the seatname or section name based on the ticket type
        ticketsMapByTicketTypeId.get(ticket.ticketTypeId)!.tickets.push({
          id: ticket.id,
          seatname: seatname,
          sectionname: sectionname,
        });
      }));

      const userOrder: UserOrderDto = {
        id: this.hashids.encode(order.id),
        showingId: order.showingId,
        status: order.status,
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
      await this.slackService.sendError(`Error in GetUserTicketService: ${error.message}`);
      
      return Err(new Error('Failed to select seat'));
    }
  }

  async executeByOriginalOrderId(originalOrderId: number, email: string): Promise<Result<UserOrderDto, Error>> {
    try {

      const order = await this.orderRepository.findOneById(originalOrderId, {
        Ticket: true,
      });

      if (!order) {
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
      await Promise.all(order.Ticket.map(async ticket => {
        // Check if the ticket type already exists in the map
        // If not, fetch the ticket type details and add it to the map
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
        var seatname = null;
        var sectionname = null;

        if(ticket.sectionId){
          sectionname = await this.getTicketTypeDetailService.getTicketTypeSectionname(ticket.ticketTypeId, ticket.sectionId);
        }

        if(ticket.seatId){
          [seatname, sectionname] = await this.getTicketTypeDetailService.getSeatSectionName(ticket.ticketTypeId, ticket.seatId);
        }
        // Fetch the seatname or section name based on the ticket type
        ticketsMapByTicketTypeId.get(ticket.ticketTypeId)!.tickets.push({
          id: ticket.id,
          seatname: seatname,
          sectionname: sectionname,
        });
      }));

      const userOrder: UserOrderDto = {
        id: this.hashids.encode(order.id),
        showingId: order.showingId,
        status: order.status,
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
      await this.slackService.sendError(`Error in GetUserTicketService: ${error.message}`);
      
      return Err(new Error('Failed to select seat'));
    }
  }


  decodeId(hash: string): number {
    const [id] = this.hashids.decode(hash) as number[];
    if (typeof id !== 'number') return null;
    return id;
  }
}