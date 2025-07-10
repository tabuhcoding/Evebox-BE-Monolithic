import { Prisma } from "prisma/client-event";
import { BaseEventRepository } from "../base.repository";

export type Districts = Prisma.districtsGetPayload<{
  include: {
    province: true;
  };
}>;

export interface DistrictsRepository extends BaseEventRepository<Districts, Prisma.districtsDelegate> {
}