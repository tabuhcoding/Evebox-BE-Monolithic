import { GetTicketTypeDetailService } from 'src/services/event-svc/modules/ticketType/queries/getTicketTypeDetail/getTicketTypeDetail.service';
import { GetPreviewShowingService } from 'src/services/event-svc/modules/showing/queries/getPreviewShowing/getPreviewShowing.service';
import { Inject, Injectable } from "@nestjs/common";
import { SlackService } from "src/infrastructure/adapters/slack/slack.service";
import { BookingTicketStatus, Order, OrderRepository } from "src/services/booking-svc/repository/order/order.repo";
import { Ticket, TicketRepository } from "src/services/booking-svc/repository/ticket/ticket.repo";
import { format } from 'date-fns';
import { EventRevenueDataDTO, OrganizerRevenueDataDTO, RevenueDataDTO, ShowingRevenueDataDTO, TicketTypeRevenueDataDTO } from "./revenue.dto";

@Injectable()
export class CalculateRevenueService {
  // Service methods go here
  constructor(
    @Inject('OrderRepository') private readonly orderRepository: OrderRepository,
    @Inject('TicketRepository') private readonly ticketRepository: TicketRepository,
    private readonly slackService: SlackService,
    private readonly getPreviewShowingService: GetPreviewShowingService,
  ) {}

  async getAllDatesInOrder(): Promise<string[]> {
    const orders = await this.orderRepository.findAll({
      createdAt: {
        gte: new Date('2025-01-01T00:00:00Z'),
      },
    });
    
    var uniqueDays = Array.from(
      new Set(orders.map((item) => format(item.createdAt, 'yyyy-MM-dd')))
    );

    uniqueDays.sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

    return uniqueDays;  
  }

  async getRevenueByDate(date: string): Promise<RevenueDataDTO> {
    try {
      const orders = await this.orderRepository.findAll({
          OR: [
            { createdAt: {
              gte: new Date(`${date}T00:00:00Z`),
              lt: new Date(`${date}T23:59:59Z`),
              },
            },
            { updatedAt: {
              gte: new Date(`${date}T00:00:00Z`),
              lt: new Date(`${date}T23:59:59Z`),
              },
            },
          ],
          status: { in: [BookingTicketStatus.SUCCESS, BookingTicketStatus.CANCEL] },
        },
        {
          Ticket: true
        }
      );

      this.slackService.sendNotice(`Calculating revenue for date: ${date}, found ${orders.length} orders.`);

      // var orderMappingShowingId = new Map<string, Order[]>();
      // var ticketMappingTicketTypeId = new Map<string, number>();

      var revenueData: RevenueDataDTO = {
        date: new Date(date),
        total_revenue: 0,
        organizers: new Map<string, OrganizerRevenueDataDTO>()
      };

      var showingMapping = new Map<string, ShowingRevenueDataDTO>();
      orders.forEach((order) => {
        // showing
        if (!showingMapping.has(order.showingId)) {
          showingMapping.set(order.showingId, {
            showing_id: order.showingId,
            start_date: new Date(),
            end_date: new Date(),
            total_revenue: order.status === BookingTicketStatus.SUCCESS ? order.totalPrice/1000 : - order.totalPrice/1000,
            ticket_types: new Map<string, TicketTypeRevenueDataDTO>()
          });
        }
        // ticket types
        const showing_revenue = showingMapping.get(order.showingId);
        showing_revenue.total_revenue += order.status === BookingTicketStatus.SUCCESS ? order.totalPrice/1000 : - order.totalPrice/1000;
        order.Ticket.forEach((ticket) => {
          if (showing_revenue.ticket_types.has(ticket.ticketTypeId)) {
            const ticketTypeRevenue = showing_revenue.ticket_types.get(ticket.ticketTypeId);
            ticketTypeRevenue.sold += 1;
            showing_revenue.ticket_types.set(ticket.ticketTypeId, ticketTypeRevenue);
          } else {
            showing_revenue.ticket_types.set(ticket.ticketTypeId, {
              name: "",
              price: 0,
              sold: 1,
              total_revenue: 0
            });
          }
        });
        showingMapping.set(order.showingId, showing_revenue);
      });

      for (const [showingId, showingData] of showingMapping.entries()) {
        const showingDetail = await this.getPreviewShowingService.execute(showingId);
        if (!showingDetail) {
          continue;
        }
        showingData.start_date = showingDetail.startTime;
        showingData.end_date = showingDetail.endTime;

        // Calculate total revenue for each ticket type
        showingDetail.TicketType.forEach((ticketType) => {
          const ticketTypeRevenue = showingData.ticket_types.get(ticketType.id);
          if (ticketTypeRevenue) {
            ticketTypeRevenue.name = ticketType.name;
            ticketTypeRevenue.price = ticketType.price;
            ticketTypeRevenue.total_revenue = ticketType.price/1000 * ticketTypeRevenue.sold;
            showingData.ticket_types.set(ticketType.id, ticketTypeRevenue);
          }
        });

        // Add to organizer data
        if (!revenueData.organizers.has(showingDetail.orgId)) {
          revenueData.organizers.set(showingDetail.orgId, {
            org_id: showingDetail.orgId,
            org_name: showingDetail.orgId,
            total_revenue: showingData.total_revenue,
            events: new Map<number, EventRevenueDataDTO>()
          });
        }

        const organizerData = revenueData.organizers.get(showingDetail.orgId);

        // Add to event data
        if (!organizerData.events.has(showingDetail.eventId)) {
          organizerData.events.set(showingDetail.eventId, {
            event_id: showingDetail.eventId,
            event_name: showingDetail.title,
            total_revenue: showingData.total_revenue,
            showings: new Map<string, ShowingRevenueDataDTO>()
          });
        }

        const eventData = organizerData.events.get(showingDetail.eventId);
        
        eventData.showings.set(showingId, showingData);
        eventData.total_revenue += showingData.total_revenue;

        organizerData.total_revenue += showingData.total_revenue;
        organizerData.events.set(showingDetail.eventId, eventData);

        // Add to revenue data
        revenueData.total_revenue += showingData.total_revenue;
        revenueData.organizers.set(showingDetail.orgId, organizerData);
      }

      return revenueData;
    } catch (error) {
      this.slackService.sendError(`Error in CalculateRevenueService.getRevenueByDate: ${error.message}`);
      return null;
    }
  }

  async getRevenueByDateWithoutFail(date: string): Promise<RevenueDataDTO> {
    try {
      const orders = await this.orderRepository.findAll({
          OR: [
            { createdAt: {
              gte: new Date(`${date}T00:00:00Z`),
              lt: new Date(`${date}T23:59:59Z`),
              },
            },
            { updatedAt: {
              gte: new Date(`${date}T00:00:00Z`),
              lt: new Date(`${date}T23:59:59Z`),
              },
            },
          ],
          status: BookingTicketStatus.SUCCESS
        },
        {
          Ticket: true
        }
      );

      this.slackService.sendNotice(`Calculating revenue for date: ${date}, found ${orders.length} orders.`);

      // var orderMappingShowingId = new Map<string, Order[]>();
      // var ticketMappingTicketTypeId = new Map<string, number>();

      var revenueData: RevenueDataDTO = {
        date: new Date(date),
        total_revenue: 0,
        organizers: new Map<string, OrganizerRevenueDataDTO>()
      };

      var showingMapping = new Map<string, ShowingRevenueDataDTO>();
      orders.forEach((order) => {
        // showing
        if (!showingMapping.has(order.showingId)) {
          showingMapping.set(order.showingId, {
            showing_id: order.showingId,
            start_date: new Date(),
            end_date: new Date(),
            total_revenue: 0,
            ticket_types: new Map<string, TicketTypeRevenueDataDTO>()
          });
        }
        // ticket types
        const showing_revenue = showingMapping.get(order.showingId);
        showing_revenue.total_revenue += order.status === BookingTicketStatus.SUCCESS ? order.totalPrice/1000 : - order.totalPrice/1000;
        order.Ticket.forEach((ticket) => {
          if (showing_revenue.ticket_types.has(ticket.ticketTypeId)) {
            const ticketTypeRevenue = showing_revenue.ticket_types.get(ticket.ticketTypeId);
            ticketTypeRevenue.sold += 1;
            showing_revenue.ticket_types.set(ticket.ticketTypeId, ticketTypeRevenue);
          } else {
            showing_revenue.ticket_types.set(ticket.ticketTypeId, {
              name: "",
              price: 0,
              sold: 1,
              total_revenue: 0
            });
          }
        });
        showingMapping.set(order.showingId, showing_revenue);
      });

      for (const [showingId, showingData] of showingMapping.entries()) {
        const showingDetail = await this.getPreviewShowingService.execute(showingId);
        if (!showingDetail) {
          continue;
        }
        showingData.start_date = showingDetail.startTime;
        showingData.end_date = showingDetail.endTime;

        // Calculate total revenue for each ticket type
        showingDetail.TicketType.forEach((ticketType) => {
          const ticketTypeRevenue = showingData.ticket_types.get(ticketType.id);
          if (ticketTypeRevenue) {
            ticketTypeRevenue.name = ticketType.name;
            ticketTypeRevenue.price = ticketType.price;
            ticketTypeRevenue.total_revenue = ticketType.price/1000 * ticketTypeRevenue.sold;
            showingData.ticket_types.set(ticketType.id, ticketTypeRevenue);
          }
        });

        // Add to organizer data
        if (!revenueData.organizers.has(showingDetail.orgId)) {
          revenueData.organizers.set(showingDetail.orgId, {
            org_id: showingDetail.orgId,
            org_name: showingDetail.orgId,
            total_revenue: 0,
            events: new Map<number, EventRevenueDataDTO>()
          });
        }

        const organizerData = revenueData.organizers.get(showingDetail.orgId);

        // Add to event data
        if (!organizerData.events.has(showingDetail.eventId)) {
          organizerData.events.set(showingDetail.eventId, {
            event_id: showingDetail.eventId,
            event_name: showingDetail.title,
            total_revenue: 0,
            showings: new Map<string, ShowingRevenueDataDTO>()
          });
        }

        const eventData = organizerData.events.get(showingDetail.eventId);
        
        eventData.showings.set(showingId, showingData);
        eventData.total_revenue += showingData.total_revenue;

        organizerData.total_revenue += showingData.total_revenue;
        organizerData.events.set(showingDetail.eventId, eventData);

        // Add to revenue data
        revenueData.total_revenue += showingData.total_revenue;
        revenueData.organizers.set(showingDetail.orgId, organizerData);
      }

      return revenueData;
    } catch (error) {
      this.slackService.sendError(`Error in CalculateRevenueService.getRevenueByDate: ${error.message}`);
      return null;
    }
  }
}