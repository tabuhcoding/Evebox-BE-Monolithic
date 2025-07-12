import { BaseAuthRepository } from "../base.repository";
import { Prisma } from "prisma/client-auth";

export type TicketTypeRevenue = Prisma.RevenueGetPayload<{
}>;

export interface TicketTypeRevenueRepository extends BaseAuthRepository<TicketTypeRevenue, Prisma.TicketTypeRevenueDelegate> {
  // getRevenueByOrganizerId(organizerId: string): Promise<OrganizeRevenue | null>;
  // getRevenueByEventId(eventId: number): Promise<OrganizeRevenue | null>;
  // getRevenueByShowingId(showingId: string): Promise<OrganizeRevenue | null>;
  // getRevenueByTicketTypeId(ticketTypeId: string): Promise<OrganizeRevenue | null>;
}