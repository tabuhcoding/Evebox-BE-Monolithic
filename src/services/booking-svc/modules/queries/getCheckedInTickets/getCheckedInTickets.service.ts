import { getShowingDetailService as GetShowingDetailService } from 'src/services/event-svc/modules/showing/queries/getShowingDetail/getShowingDetail.service';
// src/services/booking-svc/modules/queries/getCheckedInTickets/getCheckedInTickets.service.ts
import { Inject, Injectable } from '@nestjs/common';
import { Result, Ok, Err } from 'oxide.ts';
import { CheckedInTicketDto } from './getCheckedInTickets-response.dto';
import { TicketRepository } from 'src/services/booking-svc/repository/ticket/ticket.repo';

@Injectable()
export class GetCheckedInTicketsService {
  constructor(
    @Inject('TicketRepository') private readonly checkInRepo: TicketRepository,
    private readonly getShowingDetailService: GetShowingDetailService,
  ) {}

  async execute(showingId: string): Promise<Result<CheckedInTicketDto[], Error>> {
    const checkedTickets = await this.checkInRepo.getCheckedInTicketsByShowingId(showingId);

    if (!checkedTickets || checkedTickets.length === 0) {
      return Ok([]);
    }

    const showingResult = await this.getShowingDetailService.execute(showingId);
    if (showingResult.isErr()) {
      return Err(new Error('Failed to get showing info'));
    }

    const showing = showingResult.unwrap();

    const result: CheckedInTicketDto[] = checkedTickets.map(t => ({
      order_id: t.orderId,
      ticket_id: t.id,
      startTime: showing.startTime,
      endTime: showing.endTime,
      venue: showing.Events.venue,
      deliveryType: t.Order.type,
    }));

    return Ok(result);
  }
}
