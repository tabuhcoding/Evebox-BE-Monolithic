import { AppRevenueData } from "src/services/event-svc/modules/statistics/queries/getOrgRevenue/getOrgRevenue-response.dto";
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
  totalRevenue(from?: string, to?: string): Promise<AppRevenueData>;
  totalRevenueV2(from?: string, to?: string): Promise<AppRevenueData>
  // getRevenueByOrganizerId(organizerId: string): Promise<OrganizeRevenue | null>;
  // getRevenueByEventId(eventId: number): Promise<OrganizeRevenue | null>;
  // getRevenueByShowingId(showingId: string): Promise<OrganizeRevenue | null>;
  // getRevenueByTicketTypeId(ticketTypeId: string): Promise<OrganizeRevenue | null>;
}