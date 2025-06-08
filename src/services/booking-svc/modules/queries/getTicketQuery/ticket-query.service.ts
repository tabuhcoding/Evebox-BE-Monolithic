import { Injectable } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { TicketRepository } from '../../../repository/ticket/ticket.repo';

@Injectable()
export class TicketQueryService {
  constructor(
    @Inject('TicketRepository') private readonly ticketRepo: TicketRepository
  ) {}

  async getTicketsByTicketTypeIds(ticketTypeIds: string[]) {
    return this.ticketRepo.getTicketsByTicketTypeIds(ticketTypeIds);
  }
}
