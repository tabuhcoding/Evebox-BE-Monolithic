import { Injectable } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { TicketRepository } from '../../../repository/ticket/ticket.repo';

@Injectable()
export class TicketQueryService {
  constructor(
    @Inject('TicketRepository') private readonly ticketRepo: TicketRepository
  ) {}

 async getTicketQuantitiesByTicketTypeIds(ticketTypeIds: string[]): Promise<Record<string, number>> {
    return this.ticketRepo.countTicketsByTicketTypeIds(ticketTypeIds);
  }
}
