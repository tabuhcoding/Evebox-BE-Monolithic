import { BaseRepository } from "src/shared/repo/base.repository";
import { Prisma } from "@prisma/client";

export type TicketTypeSection = Prisma.TicketTypeSectionGetPayload<{
  include: {
    TicketType: true;
    Section: true;
  };
}>;

export interface TicketTypeSectionRepository extends BaseRepository<TicketTypeSection, Prisma.TicketTypeSectionDelegate> {
  // Add any specific methods for TicketTypeSection if needed, for example:
  // findByTicketTypeId(ticketTypeId: string): Promise<TicketTypeSection[]>;
  // findBySectionId(sectionId: string): Promise<TicketTypeSection[]>;
}