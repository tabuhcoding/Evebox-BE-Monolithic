import { Inject, Injectable } from "@nestjs/common";
import { Result, Err, Ok } from "oxide.ts";
import { OrganizerRevenueData, ShowingRevenueData, TicketTypeRevenueData, EventWithShowings } from "./getOrgRevenue-response.dto";
import { GetAdminAccessService } from "src/services/auth-svc/modules/user/queries/get-admin-access/get-admin-access.service";
import { EventsRepository } from "src/services/event-svc/repository/events/events.repo";
import { Pagination, PaginationQuery } from "src/shared/constants/pagination";
import { GetUserService } from "src/services/auth-svc/modules/user/queries/get-user/get-user.service";
import { GetPaidOrdersByShowingIdService } from "src/services/booking-svc/modules/queries/getPaidOrdersByShowingId/getPaidOrdersByShowingId.service";
import { Order } from "src/services/booking-svc/repository/order/order.repo";

const FEE_PERCENT = 10; // default, or can be got from OrgPaymentInfo table

@Injectable()
export class GetOrgRevenueService {
  constructor(
    private readonly getAdminAccessService: GetAdminAccessService,
    @Inject('EventsRepository') private readonly eventsRepo: EventsRepository,
    private readonly getUserService: GetUserService,
    private readonly getPaidOrdersByShowingIdService: GetPaidOrdersByShowingIdService,
  ) {}

   async execute(
    email: string,
    paginationQuery: PaginationQuery,
    fromDate?: string,
    toDate?: string,
    search?: string
  ): Promise<Result<[OrganizerRevenueData[], Pagination], Error>> {
    const isAdmin = await this.getAdminAccessService.execute(email);
    if (!isAdmin) return Err(new Error('You do not have permission to get organizer revenue'));

    const from = fromDate ? new Date(fromDate) : undefined;
    const to = toDate ? new Date(toDate) : undefined;

    if (from && to && from > to) {
      return Err(new Error("fromDate must be earlier than or equal to toDate"));
    }

    const [users, paginationResult] = await this.getUserService.getUserWithSearch(search, paginationQuery);

    const events = await this.eventsRepo.getRevenueEventsWithShowings(
      users
    );

    const orgMap = new Map<string, OrganizerRevenueData>();

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
      orderMap.get(order.showingId)!.push(order);
    }));

      await Promise.all(events.map(async (event) => {
        const orgId = event.organizerId || 'unknown';
        const orgName = event.orgName || 'Unknown';

        if (!orgMap.has(orgId)) {
          orgMap.set(orgId, {
            orgId,
            organizerName: orgName,
            totalRevenue: 0,
            actualRevenue: 0,
            platformFeePercent: FEE_PERCENT,
            events: [],
          });
        }

        let eventRevenue = 0;
        var showings: ShowingRevenueData[] = [];

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
              var type = ticketTypeMap.get(ticket.ticketTypeId);
              if (type) {
                type.sold += 1;
                type.revenue += type.price;
                showingRevenue += type.price;
              }
              ticketTypeMap.set(ticket.ticketTypeId, type!);
            }));
          }));

          const ticketTypeDetails: TicketTypeRevenueData[] = Array.from(ticketTypeMap.values());

          showings.push({
            showingId: showing.id,
            startDate: showing.startTime,
            endDate: showing.endTime,
            revenue: showingRevenue,
            ticketTypes: ticketTypeDetails,
          });

          eventRevenue += showingRevenue;
        }

        const actualEventRevenue = eventRevenue * (1 - FEE_PERCENT / 100);
        const orgData = orgMap.get(orgId)!;
        orgData.totalRevenue += eventRevenue;
        orgData.actualRevenue += actualEventRevenue;
        // if revenue is 0, add to the end of the list
        if (orgData.events.length == 0 || eventRevenue === 0) {
          orgData.events.push({
            eventId: event.id,
            eventName: event.title,
            totalRevenue: eventRevenue,
            platformFeePercent: FEE_PERCENT,
            actualRevenue: actualEventRevenue,
            showings: showings,
          });
        } else {
          orgData.events.unshift({
            eventId: event.id,
            eventName: event.title,
            totalRevenue: eventRevenue,
            platformFeePercent: FEE_PERCENT,
            actualRevenue: actualEventRevenue,
            showings: showings,
          });
        }
      }
    ));

    return Ok([Array.from(orgMap.values()), paginationResult]);
  }
}
