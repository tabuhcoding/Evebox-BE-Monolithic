import { Inject, Injectable } from "@nestjs/common";
import { Result, Ok, Err } from "oxide.ts";
import { SummaryTicketRevenueData, TicketTypeSummary } from "./getSummaryTicketRevenue-response.dto";
import { GetAdminAccessService } from "src/services/auth-svc/modules/user/queries/get-admin-access/get-admin-access.service";
import { TicketQueryService } from "src/services/booking-svc/modules/queries/getTicketQuery/ticket-query.service";
import { EventsRepository } from "src/services/event-svc/repository/events/events.repo";
import { ShowingRepository } from "src/services/event-svc/repository/showing/showing.repo";

@Injectable()
export class GetSummaryTicketRevenueService {
  constructor(
    private readonly getAdminAccessService: GetAdminAccessService,
    private readonly ticketQueryService: TicketQueryService,
    @Inject('EventsRepository') private readonly eventsRepo: EventsRepository,
    @Inject('ShowingRepository') private readonly showingRepo: ShowingRepository,
  ) {}

  async execute(email: string, showingId: string, eventId: number, orgId: string): Promise<Result<SummaryTicketRevenueData, Error>> {
    const isAdmin = await this.getAdminAccessService.execute(email);
    if (!isAdmin) return Err(new Error('Unauthorized'));

    const event = await this.eventsRepo.findEventById(eventId);
    if (!event) return Err(new Error('Event not found'));

    const showing = await this.showingRepo.findOneByIdWithTicketTypes(showingId, eventId, orgId);
    if (!showing) return Err(new Error('Showing not found'));

    const ticketTypeIds = showing.TicketType.map(tt => tt.id);
    const soldCounts = await this.ticketQueryService.getTicketQuantitiesByTicketTypeIds(ticketTypeIds);

    const byTicketType: TicketTypeSummary[] = showing.TicketType.map(tt => {
      const sold = soldCounts[tt.id] ?? 0;
      return {
        typeName: tt.name,
        price: tt.price,
        sold,
        ratio: tt.quantity ? sold / tt.quantity : 0,
      };
    });

    const totalRevenue = byTicketType.reduce((sum, t) => sum + t.price * t.sold, 0);
    const ticketsSold = byTicketType.reduce((sum, t) => sum + t.sold, 0);
    const totalTickets = showing.TicketType.reduce((sum, tt) => sum + (tt.quantity ?? 0), 0);

    const result: SummaryTicketRevenueData = {
      eventId: event.id,
      eventTitle: event.title,
      showingId: showing.id,
      startTime: showing.startTime,
      endTime: showing.endTime,
      totalRevenue,
      ticketsSold,
      totalTickets,
      percentageSold: totalTickets > 0 ? ticketsSold / totalTickets : 0,
      byTicketType,
    };

    return Ok(result);
  }
}