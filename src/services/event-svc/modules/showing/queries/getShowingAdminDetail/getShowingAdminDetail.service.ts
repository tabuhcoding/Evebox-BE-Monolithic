import { Inject, Injectable } from '@nestjs/common';
import { Result, Ok, Err } from 'oxide.ts';
import { ShowingAdminDataDto } from './getShowingAdminDetail-response.dto';
import { ShowingRepository } from '../../../../repository/showing/showing.repo';
import { TicketTypeRepository } from '../../../../repository/ticketType/ticketType.repo';
import { SeatmapRepository } from '../../../../repository/seatmap/seatmap.repo';
import { GetAdminAccessService } from 'src/services/auth-svc/modules/user/queries/get-admin-access/get-admin-access.service';
import { CountCheckedInTicketsService } from 'src/services/booking-svc/modules/queries/getCountCheckedInTickets/getCountCheckedInTickets.service';
import { CalculateShowingStatusService } from '../../../event/commands/calculateShowingStatus/calculateShowingStatus.service';
import { calculateShowingStatusAndMinPrice } from 'src/shared/utils/status/status';

@Injectable()
export class GetShowingAdminDetailService {
  constructor(
    @Inject('ShowingRepository') private readonly showingRepo: ShowingRepository,
    private readonly countCheckedInTicketsService: CountCheckedInTicketsService,
    @Inject('TicketTypeRepository') private readonly ticketTypeRepo: TicketTypeRepository,
    @Inject('SeatmapRepository') private readonly seatmapRepo: SeatmapRepository,
    private readonly getAdminAccessService: GetAdminAccessService,
    private readonly calculateShowingStatusService: CalculateShowingStatusService,
  ) {}

  async execute(showingId: string, email: string): Promise<Result<ShowingAdminDataDto, Error>> {
    const isAdmin = await this.getAdminAccessService.execute(email);
    if (!isAdmin) return Err(new Error('Unauthorized'));

    const showing = await this.showingRepo.findAdminShowingById(showingId);
    if (!showing) return Err(new Error('Showing not found'));

    await this.calculateShowingStatusService.reCalculateAllTicketTypesOfShowingStatus(showing);
    const [showingStatus, _] = await calculateShowingStatusAndMinPrice(showing.TicketType);

    const ticketSold = await this.countCheckedInTicketsService.execute( showing.TicketType.map(tt => tt.id),);

    const result: ShowingAdminDataDto = {
      id: showing.id,
      eventId: showing.eventId,
      status: showingStatus,
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
        sold: ticketSold[tt.id] || 0,
        status: tt.status || 'sold_out',
      })),
    };

    return Ok(result);
  }
}
