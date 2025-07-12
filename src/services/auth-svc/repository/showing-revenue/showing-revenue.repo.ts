import { BaseAuthRepository } from "../base.repository";
import { Prisma } from "prisma/client-auth";

export type ShowingRevenue = Prisma.ShowingRevenueGetPayload<{
  include: {
    TicketTypeRevenue: true;
  };
}>;

export interface ShowingRevenueRepository extends BaseAuthRepository<ShowingRevenue, Prisma.ShowingRevenueDelegate> {
  // getRevenueByOrganizerId(organizerId: string): Promise<OrganizeRevenue | null>;
  // getRevenueByEventId(eventId: number): Promise<OrganizeRevenue | null>;
  // getRevenueByShowingId(showingId: string): Promise<OrganizeRevenue | null>;
  // getRevenueByTicketTypeId(ticketTypeId: string): Promise<OrganizeRevenue | null>;
}