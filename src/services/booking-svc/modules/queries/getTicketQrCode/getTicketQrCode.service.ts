import { Inject, Injectable } from "@nestjs/common";
import { Result, Ok, Err } from 'oxide.ts';
import { SlackService } from "src/infrastructure/adapters/slack/slack.service";
import { TicketRepository } from "src/services/booking-svc/repository/ticket/ticket.repo";
import { encrypt, generateQRCode } from "src/shared/utils/qrcode/utils";

@Injectable()
export class GetTicketQrCodeService {
  constructor(
    private readonly slackService: SlackService,
    @Inject('TicketRepository') private readonly ticketRepository: TicketRepository,
  ) {}

  async getTicketQrCode(ticketId: string, email: string): Promise<Result<string, Error>>{
    try {
      const ticket = await this.ticketRepository.findOneById(ticketId, {
        Order: true,
      });
      if (!ticket) {
        return Err(new Error('Ticket not found'));
      }

      if (ticket.Order.ownerId && ticket.Order.ownerId !== email) {
        return Err(new Error('Unauthorized access to this ticket'));
      }

      if (!ticket.Order.ownerId && ticket.Order.userId !== email) {
        return Err(new Error('Unauthorized access to this ticket'));
      }

      if (!ticket.qrCode) {
        return Err(new Error('QR code not generated for this ticket'));
      }

      const qrData = {
        key: ticket.qrCode,
        ticketId: ticket.id,
      }
      const qrContent = JSON.stringify(qrData);
      const encryptedQrContent = encrypt(qrContent);
      const qrCode = await generateQRCode(encryptedQrContent);

      return Ok(qrCode || "Unknow");
    } catch (error) {
      await this.slackService.sendError(`GetTicketQrCodeService >>> Error fetching QR code for ticket ID ${ticketId}: ${error.message}`);
      return Err(new Error('Failed to retrieve QR code'));
    }
  }
}