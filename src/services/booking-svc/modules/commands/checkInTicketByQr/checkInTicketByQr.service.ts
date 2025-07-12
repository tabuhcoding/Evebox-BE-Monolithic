import { Inject, Injectable } from "@nestjs/common";
import { Result, Ok, Err } from "oxide.ts";
import { CheckInTicketByQrResponse } from "./checkInTicketByQr-response.dto";
import { CheckUserPermissionService } from "src/services/event-svc/modules/event/commands/checkUserPermission/checkUserPermission.service";
import { TicketRepository } from "src/services/booking-svc/repository/ticket/ticket.repo";
import { decrypt } from "src/shared/utils/qrcode/utils";
import { GetTicketTypeDetailService } from "src/services/event-svc/modules/ticketType/queries/getTicketTypeDetail/getTicketTypeDetail.service";
import { SlackService } from "src/infrastructure/adapters/slack/slack.service";

@Injectable()
export class CheckInTicketByQrService {
  constructor(
    @Inject('TicketRepository') private readonly ticketRepository: TicketRepository,
    private readonly checkUserPermissionService: CheckUserPermissionService,
    private readonly ticketTypeDetailService: GetTicketTypeDetailService,
    private readonly slackService: SlackService,
  ) {}

  async execute(encryptedQrData: string, email: string): Promise<Result<CheckInTicketByQrResponse, Error>> {
    try {
      const decryptedData = decrypt(encryptedQrData);
      const { key, ticketId } = decryptedData;
      
      const ticket = await this.ticketRepository.findOneById(ticketId, {
        Order: true
      });
      if (!ticket) {
        return Err(new Error('Ticket not found'));
      }

      const hasPermission = await this.checkUserPermissionService.hasPermissionToManageShowing(
        ticket.Order.showingId, 
        email, 
        'checkin', 
      );
      if (hasPermission.isErr()) {
        return Err(new Error(hasPermission.unwrapErr().message));
      }

      if (!hasPermission.unwrap()) {
        return Err(new Error('You do not have permission to check in tickets.'));
      }

      if (ticket.isCheckedIn) {
        return Err(new Error('Ticket is already checked in'));
      }

      if (ticket.qrCode !== key) {
        return Err(new Error('Invalid QR code for this ticket'));
      }

      await this.ticketRepository.updateOneById(ticketId, {
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
        success: true,
        seatId: ticket.seatId,
        sectionId: ticket.sectionId,
        ticketTypeId: ticket.ticketTypeId,
        seatName: seatname,
        sectionName: sectionname,
        ticketTypeName: ticketType.name,
      });

    } catch (error) {
      await this.slackService.sendError(`CheckInTicketByQrService >>> Error checking in ticket by QR: ${error.message}`);
      return Err(new Error('Failed to check in ticket by QR'));
    }
  }
}