import { Inject, Injectable } from "@nestjs/common";
import { SlackService } from "src/infrastructure/adapters/slack/slack.service";
import { BookingTicketStatus, Order, OrderRepository } from "src/services/booking-svc/repository/order/order.repo";
import { TicketRepository } from "src/services/booking-svc/repository/ticket/ticket.repo";
import { GetTicketTypeDetailService } from "src/services/event-svc/modules/ticketType/queries/getTicketTypeDetail/getTicketTypeDetail.service";
import { SeatmapType } from "src/shared/utils/status/seatmap";
import { TicketGroupedByTicketTypeID } from "../../queries/getOrdersByShowingId/getOrdersByShowingId-response.dto";
import { encrypt, generateQRCode } from "src/shared/utils/qrcode/utils";
import { Cron } from "@nestjs/schedule";

@Injectable()
export class GenerateQrcodeService {
  constructor(
    @Inject('OrderRepository') private readonly orderRepository: OrderRepository,
    @Inject('TicketRepository') private readonly ticketRepository: TicketRepository,
    private readonly slackService: SlackService,
    private readonly ticketTypeDetailService: GetTicketTypeDetailService,
  ) {}

  async execute(orderCode: number, seatmapType: SeatmapType): Promise<void> {
    // Fetch the order by orderCode
    const order = await this.orderRepository.findOneById(orderCode, {
      Ticket: true,
    });

    if (!order) {
      await this.slackService.sendError(`Booking Svc >>> generateQrcode : Order not found for orderCode: ${orderCode}`);
      throw new Error(`Order not found for orderCode: ${orderCode}`);
    }

    const doubleCheckResult = await this.doubleCheck(order, seatmapType);
    if (!doubleCheckResult) {
      await this.slackService.sendError(`WARNINGGG Booking Svc >>> generateQrcode : Double check failed for orderCode: ${orderCode}`);
    }

    // Generate QR codes for each ticket in the order
    await this.generateQrcode(order);
  }

  async doubleCheck(order: Order, seatmapType: SeatmapType): Promise<boolean> {
    // 1. Check all the ticket in the order is valid with Sale information
    // 2. Check all the ticket in the order is not has sale yet
    // 3. Return true if all checks pass, otherwise return false
    // 4. If ticket is a seat, update the seat status to "reserved" or similar
        
    switch (seatmapType) {
      case SeatmapType.NOT_A_SEATMAP:
        // Group by ticket type
        const ticketTypemap = new Map<string, TicketGroupedByTicketTypeID>();
        await Promise.all(order.Ticket.map(async ticket => {
          // Check if the ticket type already exists in the map
          // If not, fetch the ticket type details and add it to the map
          if (!ticketTypemap.has(ticket.ticketTypeId)) {
            ticketTypemap.set(ticket.ticketTypeId, {
              id: ticket.ticketTypeId,
              tickets: []
            });
          }
          ticketTypemap.get(ticket.ticketTypeId)!.tickets.push({
            id: ticket.id,
            seatID: ticket.seatId,
            sectionID: ticket.sectionId,
            qrCode: ticket.qrCode,
            description: ticket.description,
          });
        }));
        for (const [ticketTypeId, ticketGroup] of ticketTypemap.entries()) {
          const ticketType = await this.ticketTypeDetailService.getTicketTypeDetail(ticketTypeId);
          if (!ticketType) {
            await this.slackService.sendError(`Booking Svc >>> generateQrcode : Ticket type not found for ticketTypeId: ${ticketTypeId}`);
            return false; // Ticket type not found
          }

          const ticketHasQRCode = await this.ticketRepository.findAll(
            {
              ticketTypeId: ticketTypeId,
              qrCode: { $ne: null }
            }
          )
          if (ticketType.quantity < ticketHasQRCode.length + ticketGroup.tickets.length) {
            await this.slackService.sendError(`Booking Svc >>> generateQrcode : Ticket type quantity exceeded for ticketTypeId: ${ticketTypeId}`);
            return false; // Ticket type quantity exceeded
          }
        }
        break;
      case SeatmapType.SELECT_SECTION:
        // Group by ticket type ID and section ID
        // This is for the case where the order has tickets grouped by ticket type ID
        
        const sectionMap = new Map<string, Map<number, TicketGroupedByTicketTypeID>>();

        await Promise.all(order.Ticket.map(async ticket => {
          // Check if the section already exists in the map
          if (!sectionMap.has(ticket.ticketTypeId)) {
            sectionMap.set(ticket.ticketTypeId, new Map<number, TicketGroupedByTicketTypeID>());
          }
          const sectionMapByTicketType = sectionMap.get(ticket.ticketTypeId)!;
          // Check if the section ID already exists in the map
          if (!sectionMapByTicketType.has(ticket.sectionId)) {
            sectionMapByTicketType.set(ticket.sectionId, {
              id: ticket.ticketTypeId,
              tickets: []
            });
          }
          sectionMapByTicketType.get(ticket.sectionId)!.tickets.push({
            id: ticket.id,
            seatID: ticket.seatId,
            sectionID: ticket.sectionId,
            qrCode: ticket.qrCode,
            description: ticket.description,
          });
        }));

        for (const [ticketTypeId, sectionGroup] of sectionMap.entries()) {
          for (const [sectionId, ticketGroup] of sectionGroup.entries()) {
            const ticketTypeSection = await this.ticketTypeDetailService.getTicketTypeSection(ticketTypeId, sectionId);
            if (!ticketTypeSection) {
              await this.slackService.sendError(`Booking Svc >>> generateQrcode : Ticket type section not found for ticketTypeId: ${ticketTypeId}, sectionId: ${sectionId}`);
              return false; // Ticket type section not found
            }

            const ticketHasQRCode = await this.ticketRepository.findAll(
              {
                ticketTypeId: ticketTypeId,
                sectionId: sectionId,
                qrCode: { $ne: null }
              }
            )
            if (ticketTypeSection.quantity < ticketHasQRCode.length + ticketGroup.tickets.length) {
              await this.slackService.sendError(`Booking Svc >>> generateQrcode : Ticket type quantity exceeded for ticketTypeId: ${ticketTypeId}, sectionId: ${sectionId}`);
              return false; // Ticket type quantity exceeded
            }
          }
        }
        break;
      case SeatmapType.SELECT_SEAT:
        // Get list of seat IDs from the order
        const seatIDs = order.Ticket.map(ticket => ticket.seatId);
        // Check if all seat IDs are valid and not already reserved
        const isValidSeats = await this.ticketTypeDetailService.checkSeatIdIsNotBeenLocked(order.showingId, seatIDs);
        if (!isValidSeats) {
          await this.slackService.sendError(`Booking Svc >>> generateQrcode : Some seats are already reserved for orderCode: ${order.id}`);
          return false; // Some seats are already reserved
        }

        // Check if any seat in the order has a QR code already
        const seatHasQRCode = await this.ticketRepository.findAll(
          {
            Order: { showingId: order.showingId },
            seatId: { in: seatIDs },
            qrCode: { $ne: null }
          }
        );
        if (seatHasQRCode.length > 0) {
          await this.slackService.sendError(`Booking Svc >>> generateQrcode : Some seats already have QR codes for orderCode: ${order.id}`);
          return false; // Some seats already have QR codes
        }
        break;
    }
    return true; // Placeholder return value
  }

  async generateQrcode(order: Order): Promise<void> {
    try {
      // Generate QR codes for each ticket in the order
      for (const ticket of order.Ticket) {
        if (!ticket.qrCode) {
          // Generate a new QR code for the ticket
          const qrData = {
            showingId: order.showingId,
            ticketTypeId: ticket.ticketTypeId,
            seatId: ticket.seatId,
            userId: order.userId,
            ticketId: ticket.id,
          }
          const qrContent = JSON.stringify(qrData);
          const encryptedQrContent = encrypt(qrContent);
          const qrCode = await generateQRCode(encryptedQrContent);
          const qrCodeContent = qrCode || "Unknow";

          // Update the ticket with the new QR code
          await this.ticketRepository.updateOneById(ticket.id, { qrCode: qrCodeContent });
        }
      }

      // Update the order with the QR codes
      await this.orderRepository.updateOneById(order.id, {
        status: BookingTicketStatus.SUCCESS,})

      // Log success message
      await this.slackService.sendNotice(`Booking Svc >>> generateQrcode : QR codes generated successfully for orderCode: ${order.id}`);
    } catch (error) {
      // Log error message
      await this.slackService.sendError(`Booking Svc >>> generateQrcode : Error generating QR codes for orderCode: ${order.id}, Error: ${error.message}`);
    }
  }

  // @Cron('0 14 2 * * 0')
  async generateQrcodeForAllTicket(): Promise<void> {
    try {
      // Fetch all orders that are not yet processed
      const tickets = await this.ticketRepository.findAll({
        qrCode: null,
      }, {
        Order: true,
      })

      // Process each order to generate QR codes
      for (const ticket of tickets) {
        if (!ticket.qrCode) {
          // Generate a new QR code for the ticket
          const qrData = {
            showingId: ticket.Order.showingId,
            ticketTypeId: ticket.ticketTypeId,
            seatId: ticket.seatId,
            userId: ticket.Order.userId,
            ticketId: ticket.id,
          }
          const qrContent = JSON.stringify(qrData);
          const encryptedQrContent = encrypt(qrContent);
          const qrCode = await generateQRCode(encryptedQrContent);
          const qrCodeContent = qrCode || "Unknow";

          // Update the ticket with the new QR code
          await this.ticketRepository.updateOneById(ticket.id, { qrCode: qrCodeContent });
        }
      }

      // Log success message
      await this.slackService.sendNotice(`Booking Svc >>> generateQrcode : QR codes generated successfully for all pending orders`);
    } catch (error) {
      // Log error message
      await this.slackService.sendError(`Booking Svc >>> generateQrcode : Error generating QR codes for all pending orders, Error: ${error.message}`);
      return;
    }
  }
}