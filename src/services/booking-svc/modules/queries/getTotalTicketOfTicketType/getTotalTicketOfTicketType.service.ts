import { Inject, Injectable } from "@nestjs/common";
import { SlackService } from "src/infrastructure/adapters/slack/slack.service";
import { FileCacheService } from "src/infrastructure/cache/fileCache/fileCache.service";
import { AggregatedSelectTicketTypeItem } from "src/services/booking-svc/common/type";
import { OrderRepository } from "src/services/booking-svc/repository/order/order.repo";
import { TicketRepository } from "src/services/booking-svc/repository/ticket/ticket.repo";

@Injectable()
export class GetTotalTicketOfTicketTypeService {
  constructor(
    @Inject('TicketRepository') private readonly ticketRepository: TicketRepository, // Replace 'any' with the actual type of TicketRepository
    @Inject('OrderRepository') private readonly orderRepository: OrderRepository, // Replace 'any' with the actual type of OrderRepository
    private readonly slackService: SlackService,
    private readonly fileCacheService: FileCacheService,
  ) {}

  async getTotalTicketOfTicketType(ticketTypeId: string): Promise<number | null> {
    try{
      // Use the ticketRepository to count tickets by ticketTypeId
      const totalTickets = await this.ticketRepository.count({
        ticketTypeId: ticketTypeId,
      });

      return totalTickets;
    }
    catch (error) {
      await this.slackService.sendError(` Booking Svc >>> getTotalTicketOfTicketType : ${error.message}`)

      return null;
    }
  }

  async getTotalTicketOfSection(ticketTypeId: string, sectionId: number): Promise<number> {
    try{
      // Use the ticketRepository to count tickets by ticketTypeId
      const totalTickets = await this.ticketRepository.count({
        ticketTypeId: ticketTypeId,
        sectionId: sectionId,
      });

      return totalTickets;
    }
    catch (error) {
      await this.slackService.sendError(` Booking Svc >>> getTotalTicketOfSection : ${error.message}`)

      return null;
    }
  }

  async getAllSeatHasSaleOfShowing(showingId: string): Promise<number[] | null> {
    try {
      // Get all orderID of showing
      const orders = await this.orderRepository.findMany({
          showingId: showingId,
        });

      if (!orders || orders.length === 0) {
        return [];
      }

      // Get all seat IDs from the orders
      const tickets = await this.ticketRepository.findMany({
        orderId: {
          in: orders.map(order => order.id),
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
      await this.slackService.sendError(` Booking Svc >>> getAllSeatHasSaleOfShowing : ${error.message}`);
      
      return null;
    }
  }

  async getAllSeatHasSaleOfTicketType(ticketTypeId: string): Promise<number[] | null> {
    try {
      // Get all tickets of the ticket type
      const tickets = await this.ticketRepository.findMany({
        ticketTypeId: ticketTypeId,
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
      await this.slackService.sendError(` Booking Svc >>> getAllSeatHasSaleOfTicketType : ${error.message}`);
      
      return null;
    }
  }

  async getAllSeatHasPickedInCacheOfTicketType(ticketTypeId: string, showingId: string): Promise<number[] | null> {
    // Get total tickets in the cache
    const data = await this.fileCacheService.getCacheObject(
      'selectTicket',
      {
        showingId: showingId,
      }
    ) as AggregatedSelectTicketTypeItem[] | null;    
    try{
      var seatIds: number[] = [];
      if (data && data.length > 0) {
        // Filter data for the specific ticket type
        const filteredData = data.filter(item => 
          item.data.some(ticket => ticket.ticketTypeId === ticketTypeId)
        );

        // Extract seat IDs from the filtered data
        seatIds = Array.from(new Set(filteredData.flatMap(item => 
          item.data.filter(ticket => ticket.ticketTypeId === ticketTypeId).flatMap(ticket => ticket.seatId || [])
        )));
      }

      // Return the unique seat IDs
      return seatIds;
    } catch (error) {
      await this.slackService.sendError(` Booking Svc >>> getAllSeatHasPickedInCacheOfTicketType : ${error.message}`);
      
      return null;
    }
  }

  async getAllSeatHasPickedInCacheOfShowing(showingId: string): Promise<number[] | null> {
    // Get total tickets in the cache
    const data = await this.fileCacheService.getCacheObject(
      'selectTicket',
      {
        showingId: showingId,
      }
    ) as AggregatedSelectTicketTypeItem[] | null;    
    try{
      var seatIds: number[] = [];
      if (data && data.length > 0) {
        // Extract seat IDs from the data
        seatIds = Array.from(new Set(data.flatMap(item => 
          item.data.flatMap(ticket => ticket.seatId || [])
        )));
      }

      // Return the unique seat IDs
      return seatIds;
    } catch (error) {
      await this.slackService.sendError(` Booking Svc >>> getAllSeatHasPickedInCacheOfShowing : ${error.message}`);
      
      return null;
    }
  }
}