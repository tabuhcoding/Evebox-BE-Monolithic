import { Inject, Injectable } from '@nestjs/common';
import { Result, Ok, Err } from 'oxide.ts';
import { ShowingAdminDataDto } from './getShowingAdminDetail-response.dto';
import { UserRepositoryImpl } from 'src/services/auth-svc/repository/users/user.repository.impl';
import { ShowingRepository } from '../../../../repository/showing/showing.repo';
import { TicketRepository } from 'src/services/booking-svc/repository/ticket/ticket.repo';
import { TicketTypeRepository } from '../../../../repository/ticketType/ticketType.repo';
import { SeatmapRepository } from '../../../../repository/seatmap/seatmap.repo';

@Injectable()
export class GetShowingAdminDetailService {
  constructor(
    @Inject('ShowingRepository') private readonly showingRepo: ShowingRepository,
    @Inject('TicketRepository') private readonly ticketRepo: TicketRepository,
    @Inject('TicketTypeRepository') private readonly ticketTypeRepo: TicketTypeRepository,
    @Inject('SeatmapRepository') private readonly seatmapRepo: SeatmapRepository,
    private readonly userRepo: UserRepositoryImpl,
  ) {}

  async execute(showingId: string, email: string): Promise<Result<ShowingAdminDataDto, Error>> {
    const isAdmin = await this.userRepo.isAdmin(email);
    if (!isAdmin) return Err(new Error('Unauthorized'));

    const showing = await this.showingRepo.findAdminShowingById(showingId);
    if (!showing) return Err(new Error('Showing not found'));

    const showingStatus = await this.getShowingStatus(showingId);
    const ticketSold = await this.ticketRepo.countCheckedInTickets(
      showing.TicketType.map(tt => tt.id),
    );

    const result: ShowingAdminDataDto = {
      id: showing.id,
      eventId: showing.eventId,
      status: showingStatus.showingStatus,
      isFree: showing.isFree,
      isSalable: showing.isSalable,
      isPresale: showing.isPresale,
      seatMapId: showing.seatMapId,
      startTime: showing.startTime,
      endTime: showing.endTime,
      isEnabledQueueWaiting: showing.isEnabledQueueWaiting,
      showAllSeats: showing.showAllSeats,
      event: showing.Events,
      ticketTypes: showing.TicketType.map(tt => ({
        ...tt,
        sold: ticketSold,
        status: showingStatus.ticketTypesStatus[tt.id] || 'sold_out',
      })),
    };

    return Ok(result);
  }

  private async getShowingStatus(showingId: string): Promise<{ showingStatus: string; ticketTypesStatus: Record<string, string> }> {
    const showing = await this.showingRepo.getShowingStatusData(showingId);
    let showingStatus = 'sold_out';
    const ticketTypesStatus: Record<string, string> = {};

    for (const tt of showing.TicketType) {
      const status = await this.getTicketTypeStatus(showing.seatMapId, tt.id);
      ticketTypesStatus[tt.id] = status;

      if (status === 'register_now') showingStatus = 'register_now';
      else if (status === 'book_now' && showingStatus === 'sold_out') showingStatus = 'book_now';
      else if (status === 'not_open' && ['sold_out', 'book_now'].includes(showingStatus)) showingStatus = 'not_open';
      else if (status === 'register_closed') showingStatus = 'register_closed';
    }

    return { showingStatus, ticketTypesStatus };
  }

  private async getTicketTypeStatus(seatMapId: number, ticketTypeId: string): Promise<string> {
    const tt = await this.ticketTypeRepo.getTicketTypeDetails(ticketTypeId);
    const now = new Date();

    if (tt.startTime > now) return 'not_open';
    if (tt.endTime < now) return tt.price === 0 ? 'register_closed' : 'sale_closed';

    const seatMap = await this.seatmapRepo.getSeatMapById(seatMapId);
    if (!seatMap) return 'sold_out';

    const ttSectionIds = tt.sections.map(s => s.sectionId);
    for (const section of seatMap.Section) {
      if (ttSectionIds.includes(section.id)) continue;

      for (const row of section.Row) {
        for (const seat of row.Seat) {
          for (const status of seat.SeatStatus) {
            if (status.showingId === tt.showingId && status.status === 1) {
              return tt.price === 0 ? 'register_now' : 'book_now';
            }
          }
        }
      }
    }

    return 'sold_out';
  }
}
