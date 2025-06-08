import { Inject, Injectable } from "@nestjs/common";
import { Result, Ok, Err } from "oxide.ts";
import { EventRevenueData, ShowingRevenueData, TicketTypeRevenueData } from "./getOrgRevenueById-response.dto";
import { GetAdminAccessService } from "src/services/auth-svc/modules/user/queries/get-admin-access/get-admin-access.service";
import { EventsRepository } from "src/services/event-svc/repository/events/events.repo";

const FEE_PERCENT = 10; // default, or can be got from OrgPaymentInfo table

@Injectable()
export class GetOrgRevenueByIdService {
  constructor(
    @Inject('EventsRepository') private readonly eventsRepo: EventsRepository,
    private readonly getAdminAccessService: GetAdminAccessService,
  ) {}

  async execute(orgId: string, email: string): Promise<Result<EventRevenueData[], Error>> {
    const isAdmin = await this.getAdminAccessService.execute(email);
    if (!isAdmin) return Err(new Error('Unauthorized'));

    const events = await this.eventsRepo.findEventsByOrgIdWithShowings(orgId);
    const results: EventRevenueData[] = [];

    for (const event of events) {
      let eventRevenue = 0;
      const showings: ShowingRevenueData[] = [];

      for (const showing of event.Showing) {
        const ticketTypeIds = showing.TicketType.map(tt => tt.id);

        const ticketTypeMap: Record<string, TicketTypeRevenueData> = {};
        for (const tt of showing.TicketType) {
          ticketTypeMap[tt.id] = {
            ticketTypeId: tt.id,
            name: tt.name,
            price: tt.price,
            quantitySold: 0,
            revenue: 0,
          };
        }

        let showingRevenue = 0;
        for (const ticket of ticketTypeIds) {
          if (!ticket) continue;
          const type = ticketTypeMap[ticket];
          if (!type) continue;

          type.quantitySold += 1;
          type.revenue += type.price;
          showingRevenue += type.price;
        }

        showings.push({
          showingId: showing.id,
          startDate: showing.startTime,
          endDate: showing.endTime,
          revenue: showingRevenue,
          ticketTypes: Object.values(ticketTypeMap),
        });

        eventRevenue += showingRevenue;
      }

      results.push({
        eventId: event.id,
        eventName: event.title,
        totalRevenue: eventRevenue,
        platformFeePercent: FEE_PERCENT,
        actualRevenue: eventRevenue * (1 - FEE_PERCENT / 100),
        showings,
      });
    }

    return Ok(results);
  }
}