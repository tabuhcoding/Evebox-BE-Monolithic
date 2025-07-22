import { Prisma } from "prisma/client-event";
import { BaseEventRepository } from "../base.repository";

export type Districts = Prisma.districtsGetPayload<{
  include: {
    province: true;
  };
}>;

export type DistrictsWithEvents = Prisma.districtsGetPayload<{
  include: {
    province: true;
    locations: { 
      include: {
        Events: {
          include: {
            Showing: true;
          };
        };
      };
    };
  };
}>;

export interface DistrictsRepository extends BaseEventRepository<Districts, Prisma.districtsDelegate> {
  getAllWEvent(): Promise<DistrictsWithEvents[]>;
  transactions( districts: Districts[]): Promise<void>;
}