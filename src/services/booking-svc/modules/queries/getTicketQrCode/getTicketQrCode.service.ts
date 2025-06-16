import { Inject, Injectable } from "@nestjs/common";
import { Result, Ok, Err } from 'oxide.ts';
import { SlackService } from "src/infrastructure/adapters/slack/slack.service";
import { TicketRepository } from "src/services/booking-svc/repository/ticket/ticket.repo";

@Injectable()
export class GetTicketQrCodeService {
  constructor(
    private readonly slackService: SlackService,
    @Inject('TicketRepository') private readonly ticketRepository: TicketRepository,
  ) {}

  async getTicketQrCode(ticketId: string): Promise<Result<string, Error>>{
    try {
      const ticket = await this.ticketRepository.findOneById(ticketId);
      if (!ticket) {
        return Err(new Error('Ticket not found'));
      }

      if (!ticket.qrCode) {
        return Err(new Error('QR code not generated for this ticket'));
      }

      return Ok(ticket.qrCode);
    } catch (error) {
      await this.slackService.sendError(`GetTicketQrCodeService >>> Error fetching QR code for ticket ID ${ticketId}: ${error.message}`);
      return Err(new Error('Failed to retrieve QR code'));
    }
  }
}