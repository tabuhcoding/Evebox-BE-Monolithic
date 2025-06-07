import { Injectable, Inject } from '@nestjs/common';
import { TicketRepository } from '../../../repository/ticket/ticket.repo';

@Injectable()
export class CountCheckedInTicketsService {
  constructor(
    @Inject('TicketRepository')
    private readonly ticketRepo: TicketRepository
  ) {}

  async execute(ticketTypeIds: string[]): Promise<number> {
    return this.ticketRepo.countCheckedInTickets(ticketTypeIds);
  }
}
