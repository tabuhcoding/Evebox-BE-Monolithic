import { Inject, Injectable } from "@nestjs/common";
import { Result, Ok, Err } from "oxide.ts";
import { CheckInTicketResponseData } from "./checkInTicket-response.dto";
import { TicketRepository } from "src/services/booking-svc/repository/ticket/ticket.repo";
import { CheckUserPermissionService } from "src/services/event-svc/modules/event/commands/checkUserPermission/checkUserPermission.service";

@Injectable()
export class CheckInTicketService {
    constructor(
      @Inject('TicketRepository') private readonly ticketRepository: TicketRepository,
      private readonly checkUserPermissionService: CheckUserPermissionService,
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

      return Ok({
        id: ticket.id,
      });
    } catch (error) {
      console.error(error);
      return Err(new Error('Failed to check in ticket'));
    }
  }
}