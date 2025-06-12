import { Inject, Injectable } from "@nestjs/common";
import { SlackService } from "src/infrastructure/adapters/slack/slack.service";
import { FileCacheService } from "src/infrastructure/cache/fileCache/fileCache.service";
import { OrderRepository } from "src/services/booking-svc/repository/order/order.repo";
import { TicketRepository } from "src/services/booking-svc/repository/ticket/ticket.repo";
import { TicketTypeSelectionCache } from "../../queries/getRedisSeat/getRedisSeat-response.dto";
import { getShowingDetailService } from 'src/services/event-svc/modules/showing/queries/getShowingDetail/getShowingDetail.service';
import { getShowingSeatmapService } from 'src/services/event-svc/modules/showing/queries/getShowingSeatmap/getShowingSeatmap.service';
import { GetTicketTypeDetailService } from 'src/services/event-svc/modules/ticketType/queries/getTicketTypeDetail/getTicketTypeDetail.service';
import { SeatmapType } from 'src/shared/utils/status/seatmap';

@Injectable()
export class GenerateTicketService {
  constructor(
      @Inject('OrderRepository') private readonly orderRepository: OrderRepository, // Replace 'any' with the actual type of OrderRepository
      @Inject('TicketRepository') private readonly ticketRepository: TicketRepository, // Replace 'any' with the actual type of TicketRepository      
      private readonly slackService: SlackService,
      private readonly fileCacheService: FileCacheService,
      private readonly getShowingDetailService: getShowingDetailService,
      private readonly getTicketTypeDetailService: GetTicketTypeDetailService,
      private readonly getShowingSeatmapService: getShowingSeatmapService,
  
    ) {}

  async execute(orderId: number, ticketData: TicketTypeSelectionCache[]): Promise<void> {
    try{
      // Double check order
      const order = await this.orderRepository.findOneById(orderId);
      if (!order) {
        await this.slackService.sendError(`Booking Svc >>> generateTicket : Order not found for orderId: ${orderId}`);
        
        throw new Error(`Order not found for orderId: ${orderId}`);
      }

      const showingResult = await this.getShowingDetailService.execute(order.showingId);
      if (showingResult.isErr()) {
        throw (showingResult.unwrapErr());
      }
      const showing = showingResult.unwrap();
      if (!showing) {
        throw (new Error('Showing not found'));
      }

      // If seatmap ID is 0, showing not have a seatmap
      if (showing.seatMapId === 0) {
        return this.handleShowingWithoutSeatmap(ticketData, orderId);
      }

      // Fetch the seatmap for the showing
      const seatmapResult = await this.getShowingSeatmapService.getSeatMap(order.showingId);
      if (seatmapResult.isErr()) {
        throw (seatmapResult.unwrapErr());
      }

      const seatmap = seatmapResult.unwrap();

      if (!seatmap) {
        throw (new Error('Seat map not found.'));
      }

      // If the seatmap is not a seatmap
      if( seatmap.seatMapType == SeatmapType.NOT_A_SEATMAP) {
        return this.handleShowingWithoutSeatmap(ticketData, orderId);
      }

      if ( seatmap.seatMapType == SeatmapType.SELECT_SECTION) {
        return this.handleShowingWithSelectSectionSeatmap(ticketData, orderId);
      }

      if ( seatmap.seatMapType == SeatmapType.SELECT_SEAT) {
        return this.handleShowingWithSelectSeatSeatmap(ticketData, orderId);
      }
    }
    catch (error) {
      await this.slackService.sendError(`Booking Svc >>> generateTicket : ${error.message}`);
      
      throw new Error(`Failed to generate ticket: ${error.message}`);
    }
  }

  async handleShowingWithoutSeatmap(ticketData: TicketTypeSelectionCache[], orderID: number): Promise<void> {
    // If all ticketData is valid, generate tickets
    for (const ticketTypeSelection of ticketData) {
      try {        
        // TODO: Need to run in transaction
        for (let i = 0; i < ticketTypeSelection.quantity; i++) {
          const ticket = await this.ticketRepository.insertOne({
            orderId: orderID,
            description: "Evebox" + " - " + Date.now(),
            ticketTypeId: ticketTypeSelection.tickettypeId,
          });

          if (!ticket) {
            await this.slackService.sendError(`Booking Svc >>> generateTicket : Failed to create ticket for ticket type ID ${ticketTypeSelection.tickettypeId}`);
            
            throw new Error(`Failed to create ticket for ticket type ID ${ticketTypeSelection.tickettypeId}`);
          }
        }
      }
      catch (error) {
        await this.slackService.sendError(`Booking Svc >>> generateTicket : Error generating ticket for ticket type selection ${JSON.stringify(ticketTypeSelection)}: ${error.message}`);
        
        throw new Error(`Failed to generate ticket: ${error.message}`);
      }              
    }

    await this.slackService.sendNotice(`Booking Svc >>> generateTicket : Tickets generated successfully for order ID ${orderID} with ticket data: ${JSON.stringify(ticketData)}`);
  }

  async handleShowingWithSelectSectionSeatmap(ticketData: TicketTypeSelectionCache[], orderID: number): Promise<void> {
    // If all ticketData is valid, generate tickets
    for (const ticketTypeSelection of ticketData) {
      try {
        for (let i = 0; i < ticketTypeSelection.quantity; i++) {
          const ticket = await this.ticketRepository.insertOne({
            orderId: orderID,
            description: "Evebox" + " - " + Date.now(),
            ticketTypeId: ticketTypeSelection.tickettypeId,
            sectionId: ticketTypeSelection.sectionId, // Add section ID to the ticket
          });
          
          if (!ticket) {
            await this.slackService.sendError(`Booking Svc >>> generateTicket : Failed to create ticket for ticket type ID ${ticketTypeSelection.tickettypeId} in section ID ${ticketTypeSelection.sectionId}`);
            
            throw new Error(`Failed to create ticket for ticket type ID ${ticketTypeSelection.tickettypeId} in section ID ${ticketTypeSelection.sectionId}`);
          }
        }
      }
      catch (error) {
        await this.slackService.sendError(`Booking Svc >>> generateTicket : Error generating ticket for ticket type selection ${JSON.stringify(ticketTypeSelection)}: ${error.message}`);
        
        throw new Error(`Failed to generate ticket: ${error.message}`);
      }
    }

    await this.slackService.sendNotice(`Booking Svc >>> generateTicket : Tickets generated successfully for order ID ${orderID} with ticket data: ${JSON.stringify(ticketData)}`);
  }

  async handleShowingWithSelectSeatSeatmap(ticketData: TicketTypeSelectionCache[], orderID: number): Promise<void> {
    for (const ticketTypeSelection of ticketData) {
      try{
        for ( const seat of ticketTypeSelection.seatInfo){
          const ticket = await this.ticketRepository.insertOne({
            orderId: orderID,
            description: "Evebox" + " - " + Date.now(),
            ticketTypeId: ticketTypeSelection.tickettypeId,
            seatId: seat.seatId,
          });

          if (!ticket) {
            await this.slackService.sendError(`Booking Svc >>> generateTicket : Failed to create ticket for ticket type ID ${ticketTypeSelection.tickettypeId} in seat ID ${seat.seatId}`);
            
            throw new Error(`Failed to create ticket for ticket type ID ${ticketTypeSelection.tickettypeId} in seat ID ${seat.seatId}`);
          }
        }
      }
      catch (error) {
        await this.slackService.sendError(`Booking Svc >>> generateTicket : Error generating ticket for ticket type selection ${JSON.stringify(ticketTypeSelection)}: ${error.message}`);
        
        throw new Error(`Failed to generate ticket: ${error.message}`);
      }
    }

    await this.slackService.sendNotice(`Booking Svc >>> generateTicket : Tickets generated successfully for order ID ${orderID} with ticket data: ${JSON.stringify(ticketData)}`);
  }
}