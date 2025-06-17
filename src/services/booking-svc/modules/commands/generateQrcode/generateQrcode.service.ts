import { Inject, Injectable } from "@nestjs/common";
import { SlackService } from "src/infrastructure/adapters/slack/slack.service";
import { BookingTicketStatus, Order, OrderRepository } from "src/services/booking-svc/repository/order/order.repo";
import { TicketRepository } from "src/services/booking-svc/repository/ticket/ticket.repo";
import { GetTicketTypeDetailService } from "src/services/event-svc/modules/ticketType/queries/getTicketTypeDetail/getTicketTypeDetail.service";
import { SeatmapType } from "src/shared/utils/status/seatmap";
import { TicketGroupedByTicketTypeID } from "../../queries/getOrdersByShowingId/getOrdersByShowingId-response.dto";
import { encrypt, generateQRCode } from "src/shared/utils/qrcode/utils";
import { Cron } from "@nestjs/schedule";
import { EmailService } from "src/infrastructure/adapters/email/email.service";
import { UserOrderDto } from "../../queries/getUserOrder/getUserOrder-response.dto";
import PDFDocument from 'pdfkit';
import { Buffer } from 'buffer';
import * as path from 'path';
import { format } from 'date-fns';
import axios from 'axios';
import { GetUserOrderService } from "../../queries/getUserOrder/getUserOrder.service";

interface Attachments {
  name: string;
  content: Buffer;
  type: string;
}

@Injectable()
export class GenerateQrcodeService {
  constructor(
    @Inject('OrderRepository') private readonly orderRepository: OrderRepository,
    @Inject('TicketRepository') private readonly ticketRepository: TicketRepository,
    private readonly slackService: SlackService,
    private readonly ticketTypeDetailService: GetTicketTypeDetailService,
    private readonly emailService: EmailService,
    private readonly getUserOrderService: GetUserOrderService,
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
              qrCode: { not: null }
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
                qrCode: { not: null }
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
            qrCode: { not: null }
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


  async sendTicketEmail(order: UserOrderDto, email: string[]): Promise<void> {
    try{
      var attachments : Attachments[] = [];
      const fontPath = path.resolve(__dirname, '../../../../../../src/assets/fonts/Roboto.ttf');

      const pageWidth = 595;
      const pageHeight = 842;
      const margin = 40; // Small margin on each side
      const contentWidth = pageWidth - (margin * 2);

      let eventImageBuffer: Buffer | null = null;
      const imageUrl = order.Showing?.imageUrl;

      if (imageUrl) {
      try {
          const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
          eventImageBuffer = Buffer.from(response.data, 'binary');
        } catch (error) {
          await this.slackService.sendError(`Booking Svc >>> generatePDF : Error fetching event image for orderCode: ${order.id}, Error: ${error.message}`);
          eventImageBuffer = null; // Set to null if image fetch fails
        }
      }

      for (const ticketType of order.Ticket) {
        for (const ticket of ticketType.tickets) {
          const doc = new PDFDocument({ size: [pageWidth, pageHeight], margin: 0 }); // A4 size
          const buffers: Buffer[] = [];
          
          doc.registerFont('Roboto', fontPath);
          doc.font('Roboto');
                
          doc.rect(0, 0, pageWidth, pageHeight).fill('#ffffff');
          
          // Event title
          doc.fontSize(18).fillColor('#007074');
          doc.text(`${order.Showing?.title.toUpperCase() || '-'}`, 0, 60, { align: 'center', width: pageWidth });

          // Event image section - with margins
          const imageHeight = 200;
          const imageY = 120;
      
          // Draw a container for the image with margins
          doc.roundedRect(margin, imageY, contentWidth, imageHeight, 10).stroke('#dddddd');
      
          // Add event image if available, otherwise use green background
          if (eventImageBuffer) {
            try {
              // Fill the entire container with the image (no empty spaces on sides)
              doc.save(); // Save the current graphics state
              
              // Create a clipping path in the shape of the rounded rectangle
              doc.roundedRect(margin, imageY, contentWidth, imageHeight, 10).clip();
              
              // Get image dimensions to calculate proper scaling
              const img = doc.openImage(eventImageBuffer);
              const imgWidth = img.width;
              const imgHeight = img.height;
              
              // Calculate scaling to fill the container completely
              const containerRatio = contentWidth / imageHeight;
              const imageRatio = imgWidth / imgHeight;
              
              let scaledWidth, scaledHeight, offsetX, offsetY;
              
              if (imageRatio > containerRatio) {
                // Image is wider than container (relative to height)
                scaledHeight = imageHeight;
                scaledWidth = scaledHeight * imageRatio;
                offsetX = margin - ((scaledWidth - contentWidth) / 2);
                offsetY = imageY;
              } else {
                // Image is taller than container (relative to width)
                scaledWidth = contentWidth;
                scaledHeight = scaledWidth / imageRatio;
                offsetX = margin;
                offsetY = imageY - ((scaledHeight - imageHeight) / 2);
              }
              
              // Draw the image to fill the container
              doc.image(eventImageBuffer, offsetX, offsetY, { 
                width: scaledWidth,
                height: scaledHeight
              });
              
              doc.restore(); // Restore the graphics state
            } catch (error) {
              await this.slackService.sendError(`Booking Svc >>> generatePDF : Error adding event image for orderCode: ${order.id}, Error: ${error.message}`);
              // Fallback to green background if image fails
              doc.roundedRect(margin, imageY, contentWidth, imageHeight, 10).fill('#007074');
            }
          } else {
            // Fallback to green background if no image
            doc.roundedRect(margin, imageY, contentWidth, imageHeight, 10).fill('#007074');
          }
      
        
          // Check if QR code is valid (not "Unknown")
          const hasValidQRCode = ticket.qrcode && ticket.qrcode !== "Unknow";
      
          // QR Code and ticket info section - with margins
          doc.rect(margin, 340, contentWidth, 200).stroke('#dddddd');
      
          // QR Code - only if valid
          if (hasValidQRCode) {
            // If QR code is a base64 image
            if (ticket.qrcode.startsWith('data:image')) {
              const base64Image = ticket.qrcode.replace(/^data:image\/png;base64,/, '');
              const imageBuffer = Buffer.from(base64Image, 'base64');
              doc.image(imageBuffer, margin + 20, 360, { width: 150, height: 150 });
            } else {
              // If QR code is a string, generate a QR code (or use a placeholder)
              doc.rect(margin + 20, 360, 150, 150).stroke();
              doc.fontSize(10).text('QR Code:', margin + 20, 380, { width: 150, align: 'center' });
              doc.fontSize(8).text(ticket.qrcode, margin + 20, 400, { width: 150, align: 'center' });
            }
          }
      
          // Ticket information section - positioned based on whether there's a QR code
          const infoX = hasValidQRCode ? margin + 200 : margin + 20;
          const infoWidth = hasValidQRCode ? contentWidth - 220 : contentWidth - 40;
                
          // Ticket details
          doc.fontSize(10).fillColor('#666666');
          doc.text('Mã đơn:', infoX, 370);
          doc.fontSize(10).fillColor('#000000');
          doc.text(order.id || '2037583450', infoX + 70, 370);
          
          doc.fontSize(10).fillColor('#666666');
          doc.text('Loại vé:', infoX, 390);
          doc.fontSize(10).fillColor('#000000');
          doc.text(ticketType.name || '-', infoX + 70, 390, { width: infoWidth - 80 });
          
          doc.fontSize(10).fillColor('#666666');
          doc.text('Khu vực:', infoX, 410);
          doc.fontSize(10).fillColor('#000000');
          doc.text(ticket.sectionname || 'LIGHTSTICK (-2%)', infoX + 70, 410, { width: infoWidth - 80 });
          
          doc.fontSize(10).fillColor('#666666');
          doc.text('Ghế:', infoX, 430);
          doc.fontSize(10).fillColor('#000000');
          doc.text( ticket.seatname || '-', infoX + 70, 430);
          
          // Venue and time information - with margins
          doc.rect(margin, 550, contentWidth, 100).stroke('#dddddd');
          
          // Location icon
          doc.fontSize(12).fillColor('#007074');
          doc.text('Địa điểm:', margin + 10, 560);
          
          // Venue information
          doc.fontSize(12).fillColor('#000000');
          doc.text(order.Showing?.venue || '-', margin + 70, 560);
          doc.fontSize(10).fillColor('#666666');
          doc.text(order.Showing?.locationsString || '-', margin + 70, 580, { width: contentWidth - 40 });
          
          // Time icon
          doc.fontSize(12).fillColor('#007074');
          doc.text('Thời gian:', margin + 10, 610);
          
          // Format date and time
          const eventDate = order.Showing?.startTime 
            ? new Date(order.Showing.startTime)
            : new Date();
          
          const endTime = order.Showing?.endTime
            ? new Date(order.Showing.endTime)
            : new Date(eventDate.getTime() + 2 * 60 * 60 * 1000); // Default 2 hours later
          
          const formattedStartTime = eventDate.toLocaleTimeString('vi-VN', {
            hour: '2-digit',
            minute: '2-digit'
          });
          
          const formattedEndTime = endTime.toLocaleTimeString('vi-VN', {
            hour: '2-digit',
            minute: '2-digit'
          });
          
          const formattedDate = format(eventDate, 'dd/MM/yyyy');
          
          // Time information
          doc.fontSize(12).fillColor('#000000');
          doc.text(`${formattedStartTime} - ${formattedEndTime}, ${formattedDate}`, margin + 70, 610);
          
          // Issue date
          const currentDate = new Date();
          const formattedIssueDate = format(currentDate, 'dd/MM/yyyy');
          
          doc.fontSize(10).fillColor('#666666');
          doc.text(`Được tạo bởi Evebox vào ${formattedIssueDate}`, margin, 670, { align: 'center', width: contentWidth });
          
          // Terms and conditions
          doc.fontSize(14).fillColor('#000000');
          doc.text('Điều khoản và Điều kiện:', margin, 700);
          
          doc.fontSize(10).fillColor('#666666');
          doc.text('• Vé này chỉ dành cho 1 người vào cửa.', margin, 720);
          doc.text('• Không hoàn tiền cho vé đã thanh toán.', margin, 735);
          doc.text('• Người mua phải trình vé để có thể tham gia sự kiện.', margin, 750);
          doc.text('• Người mua chịu trách nhiệm bảo mật thông tin vé của mình.', margin, 765);
          doc.text('• Khi mua vé, tức là người mua đã đồng ý với các điều khoản và điều kiện được ghi rõ tại evebox.vn', margin, 780, { width: contentWidth });

          doc.on('data', buffers.push.bind(buffers));
          doc.on('end', () => {
            // const pdfBuffer = Buffer.concat(buffers);
            attachments.push({
              name: `ticket-${ticket.id}.pdf`,
              content: Buffer.concat(buffers),
              type: 'application/pdf',
            });
          });
          doc.end();
        }
      }

      // sleep for a short time to ensure all PDFs are generated before sending
      await new Promise(resolve => setTimeout(resolve, 5000));
      // Send the generated PDFs via email
      await this.emailService.sendTicketEmail(order, attachments, email);
    } catch (error) {
      await this.slackService.sendError(`Booking Svc >>> generatePDF : Error generating PDF for orderCode: ${order.id}, Error: ${error.message}`);
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

  // Test at tuesday 2:14 AM every week
  // Uncomment the following line to enable the cron job
  @Cron('0 14 22 * * 2')
  async testGenerateTicketEmail(): Promise<void> {
    console.log("testGenerateTicketEmail");
    try {
      const [sampleOrder, userId] = await this.getUserOrderService.executeByOriginalOrderIdWithoutCheck(238689)
      if (!sampleOrder) {
        await this.slackService.sendError(`Booking Svc >>> testGenerateTicketEmail : Sample order not found`);
        return;
      }

      var email = ""

      for ( const formrespon of sampleOrder.formResponse){
        if (formrespon.fieldName.includes("email") || formrespon.fieldName.includes("Email")) {
          email = formrespon.value;
          break;
        }
      }

      await this.sendTicketEmail(sampleOrder, [email, userId]);
    } catch (error) {
      await this.slackService.sendError(`Booking Svc >>> testGenerateTicketEmail : Error generating test ticket email, Error: ${error.message}`);
    }
  }

  async sendTicketEmailToUser(orderId: number) : Promise<void> {
    try {
      const [sampleOrder, userId] = await this.getUserOrderService.executeByOriginalOrderIdWithoutCheck(orderId);
      if (!sampleOrder) {
        await this.slackService.sendError(`Booking Svc >>> sendTicketEmailToUser : Sample order not found`);
        return;
      }

      var email = ""

      for ( const formrespon of sampleOrder.formResponse){
        if (formrespon.fieldName.includes("email") || formrespon.fieldName.includes("Email")) {
          email = formrespon.value;
          break;
        }
      }

      await this.sendTicketEmail(sampleOrder, [email, userId]);
    } catch (error) {
      await this.slackService.sendError(`Booking Svc >>> sendTicketEmailToUser : Error generating ticket email, Error: ${error.message}`);
    }
  }
}