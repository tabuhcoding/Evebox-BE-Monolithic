import { BaseAuthRepository } from "../base.repository";
import { Prisma } from "prisma/client-auth";

export type OrganizerRevenue = Prisma.OrganizeRevenueGetPayload<{
      include: {
        EventRevenue: {
          include: {
            ShowingRevenue: {
              include: {
                TicketTypeRevenue: true;
              };
            };
          };
        };
      }
}>;

export interface OrganizerRevenueRepository extends BaseAuthRepository<OrganizerRevenue, Prisma.OrganizeRevenueDelegate> {
  // getRevenueByOrganizerId(organizerId: string): Promise<OrganizeRevenue | null>;
  // getRevenueByEventId(eventId: number): Promise<OrganizeRevenue | null>;
  // getRevenueByShowingId(showingId: string): Promise<OrganizeRevenue | null>;
  // getRevenueByTicketTypeId(ticketTypeId: string): Promise<OrganizeRevenue | null>;
}