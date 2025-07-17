import { Inject, Injectable } from '@nestjs/common';
import { Result, Ok, Err } from 'oxide.ts';
import { TicketTypeDetailData } from './getTicketDetailOfShowing-response.dto';
import { ShowingRepository } from 'src/services/event-svc/repository/showing/showing.repo';
import { TicketTypeRepository } from 'src/services/event-svc/repository/ticketType/ticketType.repo';
import { SeatmapRepository } from 'src/services/event-svc/repository/seatmap/seatmap.repo';
import { GetAdminAccessService } from 'src/services/auth-svc/modules/user/queries/get-admin-access/get-admin-access.service';
import { CountCheckedInTicketsService } from 'src/services/booking-svc/modules/queries/getCountCheckedInTickets/getCountCheckedInTickets.service';

@Injectable()
export class GetTicketDetailOfShowingService {
  constructor(
    private readonly getAdminAccessService: GetAdminAccessService,
    @Inject('ShowingRepository')  private readonly showingRepo: ShowingRepository,
    private readonly countCheckedInTicketsService: CountCheckedInTicketsService,
    @Inject('TicketTypeRepository')  private readonly ticketTypeRepo: TicketTypeRepository,
    @Inject('SeatmapRepository')  private readonly seatmapRepo: SeatmapRepository,
  ) {}

  async execute(showingId: string, ticketTypeId: string, email: string): Promise<Result<TicketTypeDetailData, Error>> {
    const isAdmin = await this.getAdminAccessService.execute(email);
    if (!isAdmin) return Err(new Error('Unauthorized'));

    const showing = await this.showingRepo.getBasicShowingDetail(showingId, ticketTypeId);
    if (!showing || !showing.TicketType.length) return Err(new Error('No ticket of showing found'));

    const ticket = showing.TicketType[0];
    const ticketSoldMap = await this.countCheckedInTicketsService.execute([ticket.id]);
    const ticketSold = ticketSoldMap[ticket.id] ?? 0;
    const statusInfo = await this.getTicketStatus(showing.seatMapId, ticket.id);

    const result: TicketTypeDetailData = {
      id: showing.id,
      startTime: showing.startTime,
      endTime: showing.endTime,
      event: {
        id: showing.Events.id,
        title: showing.Events.title
      },
      ticketType: {
        ...ticket,
        sold: ticketSold,
        status: statusInfo,
      }
    };

    return Ok(result);
  }

  private async getTicketStatus(seatMapId: number, ticketTypeId: string): Promise<string> {
    const ticket = await this.ticketTypeRepo.getTicketTypeDetails(ticketTypeId);
    const now = new Date();

    if (ticket.startTime > now) return 'not_open';
    if (ticket.endTime < now) return ticket.price === 0 ? 'register_closed' : 'sale_closed';

    const seatMap = await this.seatmapRepo.getSeatMapById(seatMapId);
    if (!seatMap) return 'sold_out';

    const allowedSectionIds = ticket.sections.map(s => s.sectionId);
    for (const section of seatMap.Section) {
      if (allowedSectionIds.includes(section.id)) continue;

      for (const row of section.Row) {
        for (const seat of row.Seat) {
          for (const status of seat.SeatStatus) {
            if (status.showingId === ticket.showingId && status.status === 1) {
              return ticket.price === 0 ? 'register_now' : 'book_now';
            }
          }
        }
      }
    }

    return 'sold_out';
  }
}
