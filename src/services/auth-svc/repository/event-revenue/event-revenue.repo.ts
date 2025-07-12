import { BaseAuthRepository } from "../base.repository";
import { Prisma } from "prisma/client-auth";

export type EventRevenue = Prisma.EventRevenueGetPayload<{
  include: {
    ShowingRevenue: {
      include: {
        TicketTypeRevenue: true;
      };
    };
  };
}>;

export interface EventRevenueRepository extends BaseAuthRepository<EventRevenue, Prisma.EventRevenueDelegate> {
  // getRevenueByOrganizerId(organizerId: string): Promise<OrganizerRevenue | null>;
  // getRevenueByEventId(eventId: number): Promise<OrganizerRevenue | null>;
  // getRevenueByShowingId(showingId: string): Promise<OrganizeRevenue | null>;
  // getRevenueByTicketTypeId(ticketTypeId: string): Promise<OrganizeRevenue | null>;
}