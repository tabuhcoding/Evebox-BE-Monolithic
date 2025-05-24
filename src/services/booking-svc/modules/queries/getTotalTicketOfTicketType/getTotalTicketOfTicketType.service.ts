import { Inject, Injectable } from "@nestjs/common";
import { SlackService } from "src/infrastructure/adapters/slack/slack.service";
import { OrderRepository } from "src/services/booking-svc/repository/order/order.repo";
import { TicketRepository } from "src/services/booking-svc/repository/ticket/ticket.repo";

@Injectable()
export class GetTotalTicketOfTicketTypeService {
  constructor(
    @Inject('TicketRepository') private readonly ticketRepository: TicketRepository, // Replace 'any' with the actual type of TicketRepository
    @Inject('OrderRepository') private readonly orderRepository: OrderRepository, // Replace 'any' with the actual type of OrderRepository
    private readonly slackService: SlackService,
  ) {}

  async getTotalTicketOfTicketType(ticketTypeId: string): Promise<number | null> {
    try{
      // Use the ticketRepository to count tickets by ticketTypeId
      const totalTickets = await this.ticketRepository.count({
        where: {
          ticketTypeId: ticketTypeId,
        },
      });

      return totalTickets;
    }
    catch (error) {
      this.slackService.sendError(` Booking Svc >>> getTotalTicketOfTicketType : ${error.message}`)

      return null;
    }
  }

  async getTotalTicketOfSection(ticketTypeId: string, sectionId: number): Promise<number> {
    try{
      // Use the ticketRepository to count tickets by ticketTypeId
      const totalTickets = await this.ticketRepository.count({
        where: {
          ticketTypeId: ticketTypeId,
          sectionId: sectionId,
        },
      });

      return totalTickets;
    }
    catch (error) {
      this.slackService.sendError(` Booking Svc >>> getTotalTicketOfSection : ${error.message}`)

      return null;
    }
  }

  async getAllSeatHasSaleOfShowing(showingId: string): Promise<number[] | null> {
    try {
      // Get all orderID of showing
      const orders = await this.orderRepository.findMany({
        where: {
          showingId: showingId,
        },
        select: {
          id: true,
        },
      });

      if (!orders || orders.length === 0) {
        return [];
      }

      // Get all seat IDs from the orders
      const tickets = await this.ticketRepository.findMany({
        where: {
          orderId: {
            in: orders.map(order => order.id),
          },
        },
        select: {
          seatId: true,
        },
      });

      if (!tickets || tickets.length === 0) {
        return [];
      }

      // Extract unique seat IDs
      const uniqueSeatIds = Array.from(new Set(tickets.map(ticket => ticket.seatId)));

      // Return the unique seat IDs
      return uniqueSeatIds;
    }
    catch (error) {
      this.slackService.sendError(` Booking Svc >>> getAllSeatHasSaleOfShowing : ${error.message}`);
      
      return null;
    }
  }

  async getAllSeatHasSaleOfTicketType(ticketTypeId: string): Promise<number[] | null> {
    try {
      // Get all tickets of the ticket type
      const tickets = await this.ticketRepository.findMany({
        where: {
          ticketTypeId: ticketTypeId,
        },
        select: {
          seatId: true,
        },
      });

      if (!tickets || tickets.length === 0) {
        return [];
      }

      // Extract unique seat IDs
      const uniqueSeatIds = Array.from(new Set(tickets.map(ticket => ticket.seatId)));

      // Return the unique seat IDs
      return uniqueSeatIds;
    }
    catch (error) {
      this.slackService.sendError(` Booking Svc >>> getAllSeatHasSaleOfTicketType : ${error.message}`);
      
      return null;
    }
  }
}