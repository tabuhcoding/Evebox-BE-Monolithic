export { TicketTypeStatus } from '@prisma/client';

import { Prisma } from '@prisma/client';
import { BaseRepository } from 'src/shared/repo/base.repository';

export type TicketType = Prisma.TicketTypeGetPayload<{
  include: {
    Showing: true;
    sections: true;
  }
}>;

export type TicketTypeWithoutShowingAndSections = Prisma.TicketTypeGetPayload<{
  include: {
    Showing: false;
    sections: false;
  }
}>;
export interface TicketTypeRepository extends BaseRepository<TicketType, Prisma.TicketTypeDelegate> {
}