import { BaseAuthRepository } from "../base.repository";
import { Prisma } from "prisma/client-auth";

export type AdminManageEvent = Prisma.AdminManageEventGetPayload<{
}>;

export { AREACODE } from "prisma/client-auth"

export interface AdminManageEventRepository extends BaseAuthRepository<AdminManageEvent, Prisma.AdminManageEventDelegate> {
  // getRevenueByOrganizerId(organizerId: string): Promise<OrganizerRevenue | null>;
  // getRevenueByEventId(eventId: number): Promise<OrganizerRevenue | null>;
  // getRevenueByShowingId(showingId: string): Promise<OrganizeRevenue | null>;
  // getRevenueByTicketTypeId(ticketTypeId: string): Promise<OrganizeRevenue | null>;
}