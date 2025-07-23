import { Inject, Injectable } from "@nestjs/common";
import { SlackService } from "src/infrastructure/adapters/slack/slack.service";
import { FileCacheService } from "src/infrastructure/cache/fileCache/fileCache.service";
import { AggregatedSelectTicketTypeItem } from "src/services/booking-svc/common/type";
import { OrderRepository } from "src/services/booking-svc/repository/order/order.repo";
import { Ticket, TicketRepository } from "src/services/booking-svc/repository/ticket/ticket.repo";

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

  async getAllTicketHasSaleInLast2Hours(): Promise<Map<string, number>> {
    try {
      // Get the current date and time
      const currentDate = new Date();
      // Calculate the date and time 2 hours ago
      const twoHoursAgo = new Date(currentDate.getTime() - 2 * 60 * 60 * 1000);

      // Find tickets created in the last 2 hours
      const tickets = await this.ticketRepository.findMany({
        createdAt: {
          gte: twoHoursAgo,
        },
      });

      if (!tickets || tickets.length === 0) {
        return new Map();
      }
      // Create a map to hold ticketTypeId and their counts
      const ticketCountMap = new Map<string, number>();
      tickets.forEach(ticket => {
        const ticketTypeId = ticket.ticketTypeId;
        if (ticketCountMap.has(ticketTypeId)) {
          ticketCountMap.set(ticketTypeId, ticketCountMap.get(ticketTypeId) + 1);
        } else {
          ticketCountMap.set(ticketTypeId, 1);
        }
      });
    } catch (error) {
      await this.slackService.sendError(` Booking Svc >>> getAllTicketHasSaleInLast2Hours : ${error.message}`);
      
      return new Map();
    }
  }

  async getAllTicketWSectionHasSaleInLast2Hours(): Promise<Map<string, Map<number, number>>> {
    try {
      // Get the current date and time
      const currentDate = new Date();
      // Calculate the date and time 2 hours ago
      const twoHoursAgo = new Date(currentDate.getTime() - 2 * 60 * 60 * 1000);

      // Find tickets created in the last 2 hours
      const tickets = await this.ticketRepository.findMany({
        createdAt: {
          gte: twoHoursAgo,
        },
        sectionId: {
          not: null, // Ensure sectionId is not null
        }
      });

      if (!tickets || tickets.length === 0) {
        return new Map();
      }

      // Create a map to hold ticketTypeId and their section counts
      const ticketCountMap = new Map<string, Map<number, number>>();
      tickets.forEach(ticket => {
        const ticketTypeId = ticket.ticketTypeId;
        const sectionId = ticket.sectionId;

        if (!ticketCountMap.has(ticketTypeId)) {
          ticketCountMap.set(ticketTypeId, new Map<number, number>());
        }

        const sectionMap = ticketCountMap.get(ticketTypeId);
        if (sectionMap.has(sectionId)) {
          sectionMap.set(sectionId, sectionMap.get(sectionId) + 1);
        } else {
          sectionMap.set(sectionId, 1);
        }
      });

      return ticketCountMap;
    } catch (error) {
      await this.slackService.sendError(` Booking Svc >>> getAllTicketWSectionHasSaleInLast2Hours : ${error.message}`);
      
      return new Map();
    }
  }

  async getAllShowingHasSaleInLast2Hours(): Promise<string[]> {
    try {
      // Get the current date and time
      const currentDate = new Date();
      // Calculate the date and time 2 hours ago
      const twoHoursAgo = new Date(currentDate.getTime() - 2 * 60 * 60 * 1000);

      // Find tickets created in the last 2 hours
      const order = await this.orderRepository.findMany({
        createdAt: {
          gte: twoHoursAgo,
        },
      });

      if (!order || order.length === 0) {
        return [];
      }

      return Array.from(new Set(order.map(o => o.showingId)));
    } catch (error) {
      await this.slackService.sendError(` Booking Svc >>> getAllShowingHasSaleInLast2Hours : ${error.message}`);
      
      return [];
    }
  }
}