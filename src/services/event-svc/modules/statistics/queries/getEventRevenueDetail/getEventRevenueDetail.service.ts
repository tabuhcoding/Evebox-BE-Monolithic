import { Inject, Injectable } from "@nestjs/common";
import { Result, Ok, Err } from "oxide.ts";
import { ShowingRevenueData } from "./getEventRevenueDetail-response.dto";
import { GetAdminAccessService } from "src/services/auth-svc/modules/user/queries/get-admin-access/get-admin-access.service";
import { EventsRepository } from "src/services/event-svc/repository/events/events.repo";
import { TicketQueryService } from "src/services/booking-svc/modules/queries/getTicketQuery/ticket-query.service";
import { ShowingRepository } from "src/services/event-svc/repository/showing/showing.repo";
import { SaveRevenueDataService } from "src/services/auth-svc/modules/admin/commands/saveRevenueData/saveRevenueData.service";
import { convertToEventRevenueData } from "../getOrgRevenue/getOrgRevenue.service";

@Injectable()
export class GetEventRevenueDetailService {
  constructor(
    private readonly getAdminAccessService: GetAdminAccessService,
    private readonly ticketQueryService: TicketQueryService,
    @Inject('EventsRepository') private readonly eventsRepo: EventsRepository,
    @Inject('ShowingRepository') private readonly showingRepo: ShowingRepository,
    private readonly saveRevenueDataService: SaveRevenueDataService,
  ) {}

  async execute(email: string, orgId: string, eventId: number): Promise<Result<ShowingRevenueData[], Error>> {
    const isAdmin = await this.getAdminAccessService.execute(email);
    if (!isAdmin) return Err(new Error('Unauthorized'));

    const event = await this.eventsRepo.findEventById(eventId);
    if (!event) return Err(new Error('Event not found'));

    const showings = await this.showingRepo.findShowingsByOrgAndEvent(orgId, eventId);
    if (!showings.length) return Err(new Error(`No showings of event ${event.title} found`));

    const ticketTypeIds = showings.flatMap(s => s.TicketType.map(tt => tt.id));
    const ticketCounts = await this.ticketQueryService.getTicketQuantitiesByTicketTypeIds(ticketTypeIds);

    const result: ShowingRevenueData[] = showings.map(showing => {
      const totalRevenue = showing.TicketType.reduce((sum, tt) => {
        const quantitySold = ticketCounts[tt.id] ?? 0;
        return sum + quantitySold * tt.price;
      }, 0);

      return {
        showingId: showing.id,
        startTime: showing.startTime,
        endTime: showing.endTime,
        revenue: totalRevenue,
      };
    });

    return Ok(result);
  }

  async executeV2(email: string, orgId: string, eventId: number): Promise<Result<ShowingRevenueData[], Error>> {
    const isAdmin = await this.getAdminAccessService.execute(email);
    if (!isAdmin) return Err(new Error('Unauthorized'));

    const event = await this.eventsRepo.findEventById(eventId);
    if (!event) return Err(new Error('Event not found'));

    const revenue = await this.saveRevenueDataService.getEventRevenueByDateAndEventId(null,null, eventId);
    
    const result = convertToEventRevenueData(revenue)
    
    return Ok(result[0].showings.map(showing => {
      return {
        showingId: showing.showingId,
        startTime: showing.startDate,
        endTime: showing.endDate,
        revenue: showing.revenue,
      };
    }));
  }
}
