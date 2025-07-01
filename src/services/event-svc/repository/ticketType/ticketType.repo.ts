export { TicketTypeStatus } from 'prisma/client-event';
import { Result, Ok, Err } from 'oxide.ts';

import { Prisma } from 'prisma/client-event';
import { BaseEventRepository } from '../base.repository';
import { CreateTicketTypeDto } from '../../modules/ticketType/commands/createTicketType/createTicketType.dto';
import { UpdateTicketTypeDto } from '../../modules/ticketType/commands/updateTicketType/updateTicketType.dto';

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

export {TicketDeliveryType} from 'prisma/client-event'

export interface TicketTypeRepository extends BaseEventRepository<TicketType, Prisma.TicketTypeDelegate> {
  /* Create Ticket Type */
  createTicketType(dto: CreateTicketTypeDto, showingId: string, userEmail: string): Promise<Result<[string, boolean], Error>>;

  /* Update Ticket Type */
  updateTicketType(dto: UpdateTicketTypeDto, id: string, userEmail: string): Promise<Result<[string, boolean], Error>>;

  /* Delete Ticket Type */
  deleteTicketType(id: string): Promise<Result<string, Error>>;

  getTicketTypeDetails(ticketTypeId: string): Promise<any>;
}