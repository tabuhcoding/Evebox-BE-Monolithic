import { Inject, Injectable } from "@nestjs/common";
import { TicketTypeRevenue } from "prisma/client-auth";
import { SlackService } from "src/infrastructure/adapters/slack/slack.service";
import { EventRevenueRepository } from "src/services/auth-svc/repository/event-revenue/event-revenue.repo";
import { OrganizerRevenueRepository } from "src/services/auth-svc/repository/organizer-revenue/organizer-revenue.repo";
import { RevenueRepository } from "src/services/auth-svc/repository/revenue/revenue.repo";
import { ShowingRevenueRepository } from "src/services/auth-svc/repository/showing-revenue/showing-revenue.repo";
import { TicketTypeRevenueRepository } from "src/services/auth-svc/repository/tickettype-revenue/tickettype-revenue.repo";
import { RevenueData } from "src/services/booking-svc/modules/commands/calculateRevenue/revenue.dto";

@Injectable()
export class SaveRevenueDataService {
  constructor(
    @Inject('RevenueRepository') private readonly revenueRepository: RevenueRepository,
    @Inject('OrganizerRevenueRepository') private readonly organizerRevenueRepository: OrganizerRevenueRepository,
    @Inject('EventRevenueRepository') private readonly eventRevenueRepository: EventRevenueRepository,
    @Inject('ShowingRevenueRepository') private readonly showingRevenueRepository: ShowingRevenueRepository,
    @Inject('TicketTypeRevenueRepository') private readonly ticketTypeRevenueRepository: TicketTypeRevenueRepository,
    private readonly slackService: SlackService,
  ){}

  async saveRevenueData(data: RevenueData): Promise<void> {
    try{
      // revenue
      const revenue = await this.revenueRepository.insertOneWithNumberId({
        date: data.date,
        total_revenue: data.total_revenue,
      })

      // organizer revenue
      for (const [_, orgData] of data.organizers.entries()) {
        const org_revenue = await this.organizerRevenueRepository.insertOneWithNumberId({
          revenue_id: revenue,
          org_id: orgData.org_id,
          total_revenue: orgData.total_revenue,
          org_name: orgData.org_name,
        });

        // event revenue
        for (const [_, eventData] of orgData.events.entries()) {
          const event_revenue = await this.eventRevenueRepository.insertOneWithNumberId({
            org_id: org_revenue,
            event_id: eventData.event_id,
            event_name: eventData.event_name,
            total_revenue: eventData.total_revenue,
          });

          // showing revenue
          for (const [_, showingData] of eventData.showings) {
            const showing_revenue = await this.showingRevenueRepository.insertOneWithNumberId({
              event_id: event_revenue,
              showing_id: showingData.showing_id,
              start_date: showingData.start_date,
              end_date: showingData.end_date,
              total_revenue: showingData.total_revenue,
            });

            // ticket type revenue
            for (const [ticketTypeId, ticketTypeData] of showingData.ticket_types.entries()) {
              await this.ticketTypeRevenueRepository.insertOneWithNumberId({
                showing_id: showing_revenue,
                ticket_type_id: ticketTypeId,
                name: ticketTypeData.name,
                price: ticketTypeData.price,
                sold: ticketTypeData.sold,
                total_revenue: ticketTypeData.total_revenue,
              });
            }
          }
        }
      }

      await this.slackService.sendNotice(`Auth Svc >>> SaveRevenueDataService : Revenue data saved successfully for date ${data.date}`);
    }
    catch (error) {
      await this.slackService.sendError(`Auth Svc >>> SaveRevenueDataService : ${error.message}`);
      return;
    }
  }
}