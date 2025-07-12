import { Inject, Injectable } from "@nestjs/common";
import { Result, Ok, Err } from "oxide.ts";
import { CheckInTicketResponseData } from "./checkInTicket-response.dto";
import { TicketRepository } from "src/services/booking-svc/repository/ticket/ticket.repo";
import { CheckUserPermissionService } from "src/services/event-svc/modules/event/commands/checkUserPermission/checkUserPermission.service";
import { GetTicketTypeDetailService } from "src/services/event-svc/modules/ticketType/queries/getTicketTypeDetail/getTicketTypeDetail.service";
import { SlackService } from "src/infrastructure/adapters/slack/slack.service";

@Injectable()
export class CheckInTicketService {
    constructor(
      @Inject('TicketRepository') private readonly ticketRepository: TicketRepository,
      private readonly checkUserPermissionService: CheckUserPermissionService,
      private readonly ticketTypeDetailService: GetTicketTypeDetailService,
      private readonly slackService: SlackService,
    ) {}

  async execute(id: string, email: string, eventId: number): Promise<Result<CheckInTicketResponseData, Error>> {
    try {
      const hasPermission = await this.checkUserPermissionService.execute(eventId, email, 'checkin', 'checkin');
      if (hasPermission.isErr()) {
        return Err(new Error(hasPermission.unwrapErr().message));
      }

      if (!hasPermission.unwrap()) {
        return Err(new Error('You do not have permission to check in tickets.'));
      }

      const ticket = await this.ticketRepository.findOneById(id);
      if (!ticket) {
        return Err(new Error('Ticket not found'));
      }

      if (ticket.isCheckedIn) {
        return Err(new Error('Ticket is not in a valid state for check-in'));
      }

      await this.ticketRepository.updateOneById(id, {
        isCheckedIn: true,
        checkedBy: email,
      });

      const ticketType = await this.ticketTypeDetailService.getTicketTypeDetail(ticket.ticketTypeId);

      let seatname: string | null = null;
      let sectionname: string | null = null;

      if (ticket.seatId) {
        [seatname, sectionname] = await this.ticketTypeDetailService.getSeatSectionName(ticket.ticketTypeId, ticket.seatId);
      } else if (ticket.sectionId) {
        sectionname = await this.ticketTypeDetailService.getTicketTypeSectionname(ticket.ticketTypeId, ticket.sectionId);
      }

      return Ok({
        id: ticket.id,
        ticketTypeId: ticket.ticketTypeId,
        ticketTypeName: ticketType.name,
        seatId: ticket.seatId,
        sectionId: ticket.sectionId,
        seatName: seatname,
        sectionName: sectionname,
      });
    } catch (error) {
      await this.slackService.sendError(`CheckInTicketService >>> Error checking in ticket ID ${id}: ${error.message}`);
      return Err(new Error('Failed to check in ticket'));
    }
  }
}