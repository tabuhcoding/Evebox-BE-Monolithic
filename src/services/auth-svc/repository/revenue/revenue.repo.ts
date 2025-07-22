import { AppRevenueData, EventRevenueData, OrganizerRevenueData } from "src/services/event-svc/modules/statistics/queries/getOrgRevenue/getOrgRevenue-response.dto";
import { BaseAuthRepository } from "../base.repository";
import { Prisma } from "prisma/client-auth";
import { Pagination, PaginationQuery } from "src/shared/constants/pagination";

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
  totalRevenueV2(from?: string, to?: string): Promise<AppRevenueData>;
  getListOrganizerRevenue(
    pagination: PaginationQuery,
    from?: string,
    to?: string,
    search?: string,
  ): Promise<[OrganizerRevenueData[],Pagination]>;
  getListEventRevenue(
    pagination: PaginationQuery,
    from?: string,
    to?: string,
    search?: string,
  ): Promise<[EventRevenueData[], Pagination]>;
}