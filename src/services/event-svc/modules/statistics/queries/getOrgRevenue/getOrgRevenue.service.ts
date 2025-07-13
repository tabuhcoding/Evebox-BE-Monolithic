import { SaveRevenueDataService } from './../../../../../auth-svc/modules/admin/commands/saveRevenueData/saveRevenueData.service';
import { Inject, Injectable } from "@nestjs/common";
import { Result, Err, Ok } from "oxide.ts";
import { OrganizerRevenueData, ShowingRevenueData, TicketTypeRevenueData, EventWithShowings, EventRevenueData } from "./getOrgRevenue-response.dto";
import { GetAdminAccessService } from "src/services/auth-svc/modules/user/queries/get-admin-access/get-admin-access.service";
import { EventsRepository } from "src/services/event-svc/repository/events/events.repo";
import { Pagination, PaginationQuery } from "src/shared/constants/pagination";
import { GetUserService } from "src/services/auth-svc/modules/user/queries/get-user/get-user.service";
import { GetPaidOrdersByShowingIdService } from "src/services/booking-svc/modules/queries/getPaidOrdersByShowingId/getPaidOrdersByShowingId.service";
import { Order } from "src/services/booking-svc/repository/order/order.repo";
import { OrganizerRevenue } from 'src/services/auth-svc/repository/organizer-revenue/organizer-revenue.repo';
import { TicketTypeRevenue } from 'src/services/auth-svc/repository/tickettype-revenue/tickettype-revenue.repo';
import { EventRevenue } from 'src/services/auth-svc/repository/event-revenue/event-revenue.repo';
import { ShowingRevenue } from 'src/services/auth-svc/repository/showing-revenue/showing-revenue.repo';

const FEE_PERCENT = 10; // default, or can be got from OrgPaymentInfo table

@Injectable()
export class GetOrgRevenueService {
  constructor(
    private readonly getAdminAccessService: GetAdminAccessService,
    @Inject('EventsRepository') private readonly eventsRepo: EventsRepository,
    private readonly getUserService: GetUserService,
    private readonly getPaidOrdersByShowingIdService: GetPaidOrdersByShowingIdService,
    private readonly saveRevenueDataService: SaveRevenueDataService,
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

  async execueWithDB(
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

    // const [users, paginationResult] = await this.getUserService.getUserWithSearch(search, paginationQuery);

    const [revenueData, paginationResult] = await this.saveRevenueDataService.getOrganizerRevenueByDateAndOrgId(
      paginationQuery,
      fromDate?.split('T')[0], 
      toDate?.split('T')[0],
      search,
    );

    // const orgMap = new Map<string, OrganizerRevenueData>();
    // revenueData.forEach(data => {
    //   const orgId = data.org_id
    //   if (!orgMap.has(orgId)) {
    //     orgMap.set(orgId, {
    //       orgId,
    //       organizerName: data.org_name,
    //       totalRevenue: data.total_revenue,
    //       actualRevenue: data.total_revenue * (1 - FEE_PERCENT / 100),
    //       platformFeePercent: FEE_PERCENT,
    //       events: [],
    //     });
    //   }

    //   const orgData = orgMap.get(orgId)!;

    //   data.EventRevenue.forEach(event => {

    //   orgData.totalRevenue += data.total_revenue;
    //   orgData.actualRevenue += data.total_revenue * (1 - FEE_PERCENT / 100);
    // });
    const organizerRevenueData = convertToOrganizerRevenueDataFoeach(revenueData);
    return Ok([organizerRevenueData, paginationResult]);
  }
}

function convertToOrganizerRevenueData(revenueData: OrganizerRevenue[]): OrganizerRevenueData[] {
  const organizerMap = new Map<string, OrganizerRevenueData>();

  for (const orgRev of revenueData) {
    const { org_id, org_name, total_revenue, EventRevenue: events } = orgRev;

    if (!organizerMap.has(org_id)) {
      organizerMap.set(org_id, {
        orgId: org_id,
        organizerName: org_name || '',
        totalRevenue: 0,
        platformFeePercent: FEE_PERCENT,
        actualRevenue: 0,
        events: [],
      });
    }

    const organizer = organizerMap.get(org_id)!;
    organizer.totalRevenue += total_revenue;
    organizer.actualRevenue = Math.round(
      organizer.totalRevenue * (1 - FEE_PERCENT / 100)
    );

    for (const ev of events) {
      let event = organizer.events.find(e => e.eventId === ev.event_id);
      if (!event) {
        event = {
          eventId: ev.event_id,
          eventName: ev.event_name || '',
          totalRevenue: 0,
          platformFeePercent: FEE_PERCENT,
          actualRevenue: 0,
          showings: [],
        };
        organizer.events.push(event);
      }

      event.totalRevenue += ev.total_revenue;
      event.actualRevenue = Math.round(
        event.totalRevenue * (1 - FEE_PERCENT / 100)
      );

      for (const sh of ev.ShowingRevenue) {
        let showing = event.showings.find(s => s.showingId === sh.showing_id);
        if (!showing) {
          showing = {
            showingId: sh.showing_id,
            startDate: new Date(sh.start_date),
            endDate: new Date(sh.end_date),
            revenue: 0,
            ticketTypes: [],
          };
          event.showings.push(showing);
        }

        showing.revenue += sh.total_revenue;

        for (const t of sh.TicketTypeRevenue) {
          let ticketType = showing.ticketTypes.find(tt => tt.ticketTypeId === t.ticket_type_id);
          if (!ticketType) {
            ticketType = {
              ticketTypeId: t.ticket_type_id,
              name: t.name || '',
              price: t.price,
              sold: 0,
              revenue: 0,
            };
            showing.ticketTypes.push(ticketType);
          }

          ticketType.sold += t.sold;
          ticketType.revenue += t.total_revenue;
        }
      }
    }
  }

  return Array.from(organizerMap.values());
}

function convertToOrganizerRevenueDataFoeach(revenueData: OrganizerRevenue[]): OrganizerRevenueData[] {
  const organizerMap = new Map<string, OrganizerRevenueData>();

  revenueData.forEach((orgRev) => {
    const { org_id, org_name, total_revenue, EventRevenue: events } = orgRev;

    if (!organizerMap.has(org_id)) {
      organizerMap.set(org_id, {
        orgId: org_id,
        organizerName: org_name || '',
        totalRevenue: 0,
        platformFeePercent: FEE_PERCENT,
        actualRevenue: 0,
        events: [],
      });
    }

    const organizer = organizerMap.get(org_id)!;
    organizer.totalRevenue += total_revenue;
    organizer.actualRevenue = Math.round(
      organizer.totalRevenue * (1 - FEE_PERCENT / 100)
    );

    for (const ev of events) {
      let event = organizer.events.find(e => e.eventId === ev.event_id);
      if (!event) {
        event = {
          eventId: ev.event_id,
          eventName: ev.event_name || '',
          totalRevenue: 0,
          platformFeePercent: FEE_PERCENT,
          actualRevenue: 0,
          showings: [],
        };
        organizer.events.push(event);
      }

      event.totalRevenue += ev.total_revenue;
      event.actualRevenue = Math.round(
        event.totalRevenue * (1 - FEE_PERCENT / 100)
      );

      for (const sh of ev.ShowingRevenue) {
        let showing = event.showings.find(s => s.showingId === sh.showing_id);
        if (!showing) {
          showing = {
            showingId: sh.showing_id,
            startDate: new Date(sh.start_date),
            endDate: new Date(sh.end_date),
            revenue: 0,
            ticketTypes: [],
          };
          event.showings.push(showing);
        }

        showing.revenue += sh.total_revenue;

        for (const t of sh.TicketTypeRevenue) {
          let ticketType = showing.ticketTypes.find(tt => tt.ticketTypeId === t.ticket_type_id);
          if (!ticketType) {
            ticketType = {
              ticketTypeId: t.ticket_type_id,
              name: t.name || '',
              price: t.price,
              sold: 0,
              revenue: 0,
            };
            showing.ticketTypes.push(ticketType);
          }

          ticketType.sold += t.sold;
          ticketType.revenue += t.total_revenue;
        }
      }
    }
  });

  return Array.from(organizerMap.values());
}


function convertToEventRevenueData(eventData: EventRevenue[]): EventRevenueData[] {
  const eventMap = new Map<number, EventRevenueData>();

  eventData.forEach((ev) => {
    let event = eventMap.get(ev.event_id);
    if (!event) {
      event = {
        eventId: ev.event_id,
        eventName: ev.event_name || '',
        totalRevenue: 0,
        platformFeePercent: FEE_PERCENT,
        actualRevenue: 0,
        showings: [],
      };
      eventMap.set(ev.event_id, event);
    }

    event.totalRevenue += ev.total_revenue;
    event.actualRevenue = Math.round(event.totalRevenue * (1 - FEE_PERCENT / 100));

    for (const showing of ev.ShowingRevenue) {
      let showingData = event.showings.find(s => s.showingId === showing.showing_id);
      if (!showingData) {
        showingData = {
          showingId: showing.showing_id,
          startDate: new Date(showing.start_date),
          endDate: new Date(showing.end_date),
          revenue: 0,
          ticketTypes: [],
        };
        event.showings.push(showingData);
      }

      showingData.revenue += showing.total_revenue;

      for (const ticketType of showing.TicketTypeRevenue) {
        let ticketTypeData = showingData.ticketTypes.find(tt => tt.ticketTypeId === ticketType.ticket_type_id);
        if (!ticketTypeData) {
          ticketTypeData = {
            ticketTypeId: ticketType.ticket_type_id,
            name: ticketType.name || '',
            price: ticketType.price,
            sold: 0,
            revenue: 0,
          };
          showingData.ticketTypes.push(ticketTypeData);
        }

        ticketTypeData.sold += ticketType.sold;
        ticketTypeData.revenue += ticketType.total_revenue;
      }
    }
  });

  return Array.from(eventMap.values());
}

function convertToShowingRevenueData(showingData: ShowingRevenue[]): ShowingRevenueData[] {
  const showingMap = new Map<string, ShowingRevenueData>();

  showingData.forEach(sh => {
    let showing = showingMap.get(sh.showing_id);
    if (!showing) {
      showing = {
        showingId: sh.showing_id,
        startDate: new Date(sh.start_date),
        endDate: new Date(sh.end_date),
        revenue: 0,
        ticketTypes: [],
      };
      showingMap.set(sh.showing_id, showing);
    }

    showing.revenue += sh.total_revenue;

    for (const t of sh.TicketTypeRevenue) {
      let ticketType = showing.ticketTypes.find(tt => tt.ticketTypeId === t.ticket_type_id);
      if (!ticketType) {
        ticketType = {
          ticketTypeId: t.ticket_type_id,
          name: t.name || '',
          price: t.price,
          sold: 0,
          revenue: 0,
        };
        showing.ticketTypes.push(ticketType);
      }

      ticketType.sold += t.sold;
      ticketType.revenue += t.total_revenue;
    }
  });

  return Array.from(showingMap.values());
}

function convertToTicketTypeRevenueData(ticketData: TicketTypeRevenue[]): TicketTypeRevenueData[] {
  const ticketMap = new Map<string, TicketTypeRevenueData>();

  ticketData.forEach(t => {
    let ticketType = ticketMap.get(t.ticket_type_id);
    if (!ticketType) {
      ticketType = {
        ticketTypeId: t.ticket_type_id,
        name: t.name || '',
        price: t.price,
        sold: 0,
        revenue: 0,
      };
      ticketMap.set(t.ticket_type_id, ticketType);
    }

    ticketType.sold += t.sold;
    ticketType.revenue += t.total_revenue;
  });

  return Array.from(ticketMap.values());
}
