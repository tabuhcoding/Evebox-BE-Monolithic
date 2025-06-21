import { Inject, Injectable } from "@nestjs/common";
import { Result, Err, Ok } from "oxide.ts";
import { OrganizerRevenueData, ShowingRevenueData, TicketTypeRevenueData, EventWithShowings } from "./getOrgRevenue-response.dto";
import { GetAdminAccessService } from "src/services/auth-svc/modules/user/queries/get-admin-access/get-admin-access.service";
import { EventsRepository } from "src/services/event-svc/repository/events/events.repo";
import { Pagination, PaginationQuery } from "src/shared/constants/pagination";

const FEE_PERCENT = 10; // default, or can be got from OrgPaymentInfo table

@Injectable()
export class GetOrgRevenueService {
  constructor(
    private readonly getAdminAccessService: GetAdminAccessService,
    @Inject('EventsRepository') private readonly eventsRepo: EventsRepository,
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

    const [events, pagination] = await this.eventsRepo.getRevenueEventsWithShowings(
      paginationQuery, from, to, search
    );

    const orgMap = new Map<string, OrganizerRevenueData>();

    for (const event of events) {
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
      const showings: ShowingRevenueData[] = [];

      for (const showing of event.Showing) {
        let showingRevenue = 0;

        const ticketTypeMap = new Map<
          string,
          { name: string; price: number; sold: number }
        >();

        const ticketTypeIds = showing.TicketType.map(tt => tt.id);
        showing.TicketType.forEach(tt => {
          ticketTypeMap.set(tt.id, { name: tt.name, price: tt.price, sold: 0 });
        });


        for (const ticket of ticketTypeIds) {
          const type = ticketTypeMap.get(ticket);
          if (type) {
            type.sold += 1;
            showingRevenue += type.price;
          }
        }

        const ticketTypeDetails: TicketTypeRevenueData[] = [];
        for (const [typeId, info] of ticketTypeMap.entries()) {
          ticketTypeDetails.push({
            ticketTypeId: typeId,
            name: info.name,
            price: info.price,
            sold: info.sold,
            revenue: info.sold * info.price,
          });
        }

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
      orgData.events.push({
        eventId: event.id,
        eventName: event.title,
        totalRevenue: eventRevenue,
        actualRevenue: actualEventRevenue,
        platformFeePercent: FEE_PERCENT,
        showings,
      });
    }

    return Ok([Array.from(orgMap.values()), pagination]);
  }
}
