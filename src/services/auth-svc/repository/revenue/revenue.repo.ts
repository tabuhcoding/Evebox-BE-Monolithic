import { BaseAuthRepository } from "../base.repository";
import { Prisma } from "prisma/client-auth";

export type Revenue = Prisma.RevenueGetPayload<{
  include: {
    OrganizeRevenue: {
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
    }
  };
}>;

export interface RevenueRepository extends BaseAuthRepository<Revenue, Prisma.RevenueDelegate> {
  // getRevenueByOrganizerId(organizerId: string): Promise<OrganizeRevenue | null>;
  // getRevenueByEventId(eventId: number): Promise<OrganizeRevenue | null>;
  // getRevenueByShowingId(showingId: string): Promise<OrganizeRevenue | null>;
  // getRevenueByTicketTypeId(ticketTypeId: string): Promise<OrganizeRevenue | null>;
}