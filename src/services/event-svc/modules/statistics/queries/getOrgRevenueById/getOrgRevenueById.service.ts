import { Inject, Injectable } from "@nestjs/common";
import { Result, Ok, Err } from "oxide.ts";
import { EventRevenueData, ShowingRevenueData, TicketTypeRevenueData } from "../getOrgRevenue/getOrgRevenue-response.dto";
import { GetAdminAccessService } from "src/services/auth-svc/modules/user/queries/get-admin-access/get-admin-access.service";
import { EventsRepository } from "src/services/event-svc/repository/events/events.repo";
import { OrganizerRevenueData } from "../getOrgRevenue/getOrgRevenue-response.dto";
import { GetPaidOrdersByShowingIdService } from "src/services/booking-svc/modules/queries/getPaidOrdersByShowingId/getPaidOrdersByShowingId.service";
import { Order } from "src/services/booking-svc/repository/order/order.repo";

const FEE_PERCENT = 10; // default, or can be got from OrgPaymentInfo table

@Injectable()
export class GetOrgRevenueByIdService {
  constructor(
    @Inject('EventsRepository') private readonly eventsRepo: EventsRepository,
    private readonly getAdminAccessService: GetAdminAccessService,
    private readonly getPaidOrdersByShowingIdService: GetPaidOrdersByShowingIdService,
  ) {}

  async execute(orgId: string, email: string,
    fromDate?: string,
    toDate?: string,
  ): Promise<Result<OrganizerRevenueData, Error>> {
    const isAdmin = await this.getAdminAccessService.execute(email);
    if (!isAdmin) return Err(new Error('Unauthorized'));

    const from = fromDate ? new Date(fromDate) : undefined;
    const to = toDate ? new Date(toDate) : undefined;

    if (from && to && from > to) {
      return Err(new Error("fromDate must be earlier than or equal to toDate"));
    }

    const events = await this.eventsRepo.findEventsByOrgIdWithShowings(orgId);
    var result: OrganizerRevenueData

    const showingIds = await Promise.all(events.map(event =>
      event.Showing.map(showing => showing.id)
    )).then(arrays => arrays.flat());
    
    const ordersResult = await this.getPaidOrdersByShowingIdService.executeWithMultipleShowings(showingIds, from, to);
    if (!ordersResult) {
      return Err(new Error('Failed to retrieve orders for showings'));
    }

    const orderMap = new Map<string, Order[]>();
    await Promise.all(ordersResult.map(order => {
      if (!orderMap.has(order.showingId)) {
        orderMap.set(order.showingId, []);
      }
      orderMap.get(order.showingId)?.push(order);
    }));

    await Promise.all(events.map(async (event) => {
      let eventRevenue = 0;
      const orgId = event.organizerId;
      const orgName = event.orgName;

      let showings: ShowingRevenueData[] = [];
      for (const showing of event.Showing) {
        let showingRevenue = 0;

        var ticketTypeMap = new Map<string, TicketTypeRevenueData>();
        await Promise.all(showing.TicketType.map(async (ticketType) => {
          ticketTypeMap.set(ticketType.id, {
            ticketTypeId: ticketType.id,
            name: ticketType.name,
            price: ticketType.price,
            sold: 0,
            revenue: 0,
          });
        }));

        const orders = orderMap.get(showing.id) || [];
        await Promise.all(orders.map(async order => {
          await Promise.all(order.Ticket.map(ticket => {
            const type = ticketTypeMap.get(ticket.ticketTypeId);
            if (type) {
              type.sold += 1;
              type.revenue += type.price;
              showingRevenue += type.price;
            }
          }));
        }));

        const ticketTypeDetails = Array.from(ticketTypeMap.values());
        showings.push({
          showingId: showing.id,
          startDate: showing.startTime,
          endDate: showing.endTime,
          revenue: showingRevenue,
          ticketTypes: ticketTypeDetails,
        });
        eventRevenue += showingRevenue;
      }
      const platformFee = (eventRevenue * FEE_PERCENT) / 100;
      const actualRevenue = eventRevenue - platformFee; 

      result = {
        orgId,
        organizerName: orgName,
        totalRevenue: (result?.totalRevenue || 0) + eventRevenue,
        actualRevenue: (result?.actualRevenue || 0) + actualRevenue,
        platformFeePercent: FEE_PERCENT,
        events: [
          ...(result?.events || []),
          {
            eventId: event.id,
            eventName: event.title,
            totalRevenue: eventRevenue,
            platformFeePercent: FEE_PERCENT,
            actualRevenue: actualRevenue,
            showings: showings
          }
        ],
      };
    }));

    return Ok(result);
  }
}