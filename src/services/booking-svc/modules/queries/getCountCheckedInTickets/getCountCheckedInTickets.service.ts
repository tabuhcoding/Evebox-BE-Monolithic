import { Injectable, Inject } from '@nestjs/common';
import { TicketRepository } from '../../../repository/ticket/ticket.repo';

@Injectable()
export class CountCheckedInTicketsService {
  constructor(
    @Inject('TicketRepository')
    private readonly ticketRepo: TicketRepository
  ) {}

  async execute(ticketTypeIds: string[]): Promise<Record<string, number>> {
    return this.ticketRepo.countTicketsByTicketTypeIds(ticketTypeIds);
  }
}
