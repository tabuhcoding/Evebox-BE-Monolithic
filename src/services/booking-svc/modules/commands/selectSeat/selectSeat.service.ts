import { Inject, Injectable } from '@nestjs/common';
import { Result, Ok, Err } from 'oxide.ts';
import { SelectSeatDto } from './selectSeat.dto';
import { getShowingSeatmapService } from 'src/services/event-svc/modules/showing/queries/getShowingSeatmap/getShowingSeatmap.service';
import { SeatmapType } from 'src/shared/utils/status/seatmap';
import { getShowingDetailService } from 'src/services/event-svc/modules/showing/queries/getShowingDetail/getShowingDetail.service';
import { GetTicketTypeDetailService } from 'src/services/event-svc/modules/ticketType/queries/getTicketTypeDetail/getTicketTypeDetail.service';
import { TicketRepository } from 'src/services/booking-svc/repository/ticket/ticket.repo';
import { FileCacheService } from 'src/infrastructure/cache/fileCache/fileCache.service';
import { SlackService } from 'src/infrastructure/adapters/slack/slack.service';
import { CheckUserExistService } from 'src/services/auth-svc/modules/user/commands/checkuserExist/checkuserExist.service';
import { ShowingSeatMapResponseDto } from 'src/services/event-svc/modules/showing/queries/getShowingSeatmap/getShowingSeatmap-response.dto';
import { SeatStatusEnum } from 'src/services/event-svc/repository/seatStatus/seatStatus.repo';

interface SelectTicketTypeData {
  userId: string;
  ticketTypeId: string;
  sectionId?: number;
  quantity: number;
} 

interface AggregatedSelectTicketTypeItem {
  id: string;
  timestamp: number;
  timeout: number;
  data: SelectTicketTypeData;
}

interface SelectSeatData {
  userId: string;
  seatId: number[];
}

interface AggregatedSelectSeatItem {
  id: string;
  timestamp: number;
  timeout: number;
  data: SelectSeatData;
}

@Injectable()
export class SelectSeatService {
  constructor(
    @Inject('TicketRepository') private readonly ticketRepository: TicketRepository, // Replace 'any' with the actual type of TicketRepository
    private readonly getShowingSeatmapService: getShowingSeatmapService,
    private readonly getShowingDetailService: getShowingDetailService,
    private readonly getTicketTypeDetailService: GetTicketTypeDetailService,
    private readonly fileCacheService: FileCacheService,
    private readonly slackService: SlackService,
    private readonly checkUserExistService: CheckUserExistService,
  ) {}
  async execute(selectSeatDto: SelectSeatDto, email: string): Promise<Result<Boolean, Error>> {
    try {
      // Check if the user exists
      const userExists = await this.checkUserExistService.execute(email);
      if (!userExists) {
        return Err(new Error('User does not exist'));
      }

      // Fetch the current showing
      if (!selectSeatDto.showingId) {
        return Err(new Error('Showing ID is required'));
      }

      const showingResult = await this.getShowingDetailService.execute(selectSeatDto.showingId);
      if (showingResult.isErr()) {
        return Err(showingResult.unwrapErr());
      }
      const showing = showingResult.unwrap();
      if (!showing) {
        return Err(new Error('Showing not found'));
      }

      // If seatmap ID is 0, showing not have a seatmap
      if (showing.seatMapId === 0) {
        return this.handleShowingWithoutSeatmap(selectSeatDto, email);
      }

      // Fetch the seatmap for the showing
      const seatmapResult = await this.getShowingSeatmapService.getSeatMap(selectSeatDto.showingId);
      if (seatmapResult.isErr()) {
        return Err(seatmapResult.unwrapErr());
      }

      const seatmap = seatmapResult.unwrap();

      if (!seatmap) {
        return Err(new Error('Seat map not found.'));
      }

      // If the seatmap is not a seatmap
      if( seatmap.seatMapType == SeatmapType.NOT_A_SEATMAP) {
        return this.handleShowingWithoutSeatmap(selectSeatDto, email);
      }

      if ( seatmap.seatMapType == SeatmapType.SELECT_SECTION) {
        return this.handleShowingWithSelectSectionSeatmap(selectSeatDto, email);
      }

      if ( seatmap.seatMapType == SeatmapType.SELECT_SEAT) {
        return this.handleShowingWithSelectSeatSeatmap(selectSeatDto, email, seatmap);
      }
      
      return Ok(false);
    } catch (error) {
      console.error(error);
      return Err(new Error('Failed to select seat'));
    }
  }
  
  async handleShowingWithoutSeatmap(selectSeatDto: SelectSeatDto, email: string): Promise<Result<Boolean, Error>> {
    try {
      if (!selectSeatDto.tickettypeId || selectSeatDto.tickettypeId === '') {
        return Err(new Error('Ticket type ID is required'));
      }

      // Get ticket type details
      const ticketType = await this.getTicketTypeDetailService.getTicketTypeDetail(selectSeatDto.tickettypeId);
      if (!ticketType) {
        return Err(new Error('Ticket type not found'));
      }

      // Check if the quentity is larger than minimum quantity and less than maximum quantity
      if (selectSeatDto.quantity < ticketType.minQtyPerOrder || selectSeatDto.quantity > ticketType.maxQtyPerOrder) {
        return Err(new Error(`Quantity must be between ${ticketType.minQtyPerOrder} and ${ticketType.maxQtyPerOrder}`));
      }

      // Get total tickets of the ticket type
      const totalTickets = await this.ticketRepository.count(
        {
          ticketTypeId: ticketType.id,
          Order: {
            showingId: selectSeatDto.showingId,
          }
        }
      )

      // Get total tickets in the cache
      const data = await this.fileCacheService.getCacheObject(
        'selectTicket',
        {
          showingId: selectSeatDto.showingId
        }
      ) as AggregatedSelectTicketTypeItem[] | null;

      let totalSelectedTickets = 0;
      if (data) {
        // Aggregate total selected tickets
        totalSelectedTickets = data.reduce((acc, item) => {
          if (item.data.ticketTypeId === selectSeatDto.tickettypeId && item.data.userId !== email) {
            return acc + item.data.quantity;
          }
          return acc;
        }, 0);
      }

      // Check if the total selected tickets exceed the total tickets of the ticket type
      if (totalSelectedTickets + selectSeatDto.quantity + totalTickets > ticketType.quantity) {
        console.log(`Total selected tickets: ${totalSelectedTickets}, Total tickets of ticket type: ${ticketType.quantity}, Selected quantity: ${selectSeatDto.quantity}`);
        
        return Err(new Error('Selected quantity exceeds available tickets for this ticket type'));
      }

      // Check if the user has already selected this ticket type
      const existingTicket = data?.find(item => item.data.ticketTypeId === selectSeatDto.tickettypeId && item.data.userId === email);
      if (existingTicket) {
        // If the user has already selected this ticket type, update the quantity
        existingTicket.data.quantity = selectSeatDto.quantity;
        await this.fileCacheService.cacheObject(
          'selectTicket',
          20,
          { showingId: selectSeatDto.showingId },
          { id: existingTicket.id, ...existingTicket.data }
        );
      }
      else {
        // If the user has not selected this ticket type, create a new entry
        const newTicketData: SelectTicketTypeData = {
          userId: email,
          ticketTypeId: selectSeatDto.tickettypeId,
          quantity: selectSeatDto.quantity,
        };

        const newItem: AggregatedSelectTicketTypeItem = {
          id: `${email}`,
          timestamp: Date.now(),
          timeout: 20, // Cache timeout in minutes
          data: newTicketData,
        };

        await this.fileCacheService.cacheObject(
          'selectTicket',
          20,
          { showingId: selectSeatDto.showingId },
          { id: newItem.id, ...newItem.data }
        );
      }

      return Ok(true);
      }
    catch (error) {
      this.slackService.sendError(`Booking Svc >>> selectSeat: ${error.message} with data: ${JSON.stringify(selectSeatDto)}`);

      return Err(new Error('Showing does not have a seatmap'));
    }
  }

  async handleShowingWithSelectSectionSeatmap(
    selectSeatDto: SelectSeatDto,
    email: string,
  ): Promise<Result<Boolean, Error>> {
    try{
      // Check if the section ID is provided
      if (!selectSeatDto.sectionId || selectSeatDto.sectionId <= 0) {
        return Err(new Error('Section ID is required'));
      }

      // Check if the ticket type ID is provided
      if (!selectSeatDto.tickettypeId || selectSeatDto.tickettypeId === '') {
        return Err(new Error('Ticket type ID is required'));
      }

      // Get ticket type details
      const ticketType = await this.getTicketTypeDetailService.getTicketTypeDetail(selectSeatDto.tickettypeId);
      if (!ticketType) {
        return Err(new Error('Ticket type not found'));
      }

      // Check if the section ID exists in the ticket type's sections
      const section = ticketType.sections.find(sec => sec.sectionId === selectSeatDto.sectionId);
      if (!section) {
        return Err(new Error(`Section ID ${selectSeatDto.sectionId} not found in ticket type`));
      }

      // Check if the quantity is within the allowed range
      if (selectSeatDto.quantity < ticketType.minQtyPerOrder || selectSeatDto.quantity > ticketType.maxQtyPerOrder) {
        return Err(new Error(`Quantity must be between ${ticketType.minQtyPerOrder} and ${ticketType.maxQtyPerOrder}`));
      }

      // Get total tickets of the ticket type in the specified section
      const totalTickets = await this.ticketRepository.count({
        ticketTypeId: ticketType.id,
        sectionId: selectSeatDto.sectionId,
        Order: {
          showingId: selectSeatDto.showingId,
        }
      });

      // Get total tickets in the cache
      const data = await this.fileCacheService.getCacheObject(
        'selectTicket',
        {
          showingId: selectSeatDto.showingId,
        }
      ) as AggregatedSelectTicketTypeItem[] | null;

      let totalSelectedTickets = 0;
      if (data) {
        // Aggregate total selected tickets in the specified section
        totalSelectedTickets = data.reduce((acc, item) => {
          if (item.data.ticketTypeId === selectSeatDto.tickettypeId && item.data.sectionId === selectSeatDto.sectionId && item.data.userId !== email) {
            return acc + item.data.quantity;
          }
          return acc;
        }, 0);
      }

      // Check if the total selected tickets exceed the total tickets of the ticket type in the specified section
      if (totalSelectedTickets + selectSeatDto.quantity + totalTickets > section.quantity) {
        console.log(`Total selected tickets: ${totalSelectedTickets}, Total tickets of ticket type in section: ${section.quantity}, Selected quantity: ${selectSeatDto.quantity}`);

        return Err(new Error('Selected quantity exceeds available tickets for this ticket type in the specified section'));
      }

      // Check if the user has already selected this ticket type in the specified section
      const existingTicket = data?.find(item => item.data.ticketTypeId === selectSeatDto.tickettypeId && item.data.sectionId === selectSeatDto.sectionId && item.data.userId === email);
      if (existingTicket) {
        // If the user has already selected this ticket type in the specified section, update the quantity
        existingTicket.data.quantity = selectSeatDto.quantity;
        await this.fileCacheService.cacheObject(
          'selectTicket',
          20,
          { showingId: selectSeatDto.showingId },
          { id: existingTicket.id, ...existingTicket.data }
        );
      } else {
        // If the user has not selected this ticket type in the specified section, create a new entry
        const newTicketData: SelectTicketTypeData = {
          userId: email,
          ticketTypeId: selectSeatDto.tickettypeId,
          sectionId: selectSeatDto.sectionId,
          quantity: selectSeatDto.quantity,
        };

        const newItem: AggregatedSelectTicketTypeItem = {
          id: `${email}`,
          timestamp: Date.now(),
          timeout: 20, // Cache timeout in minutes
          data: newTicketData,
        };

        await this.fileCacheService.cacheObject(
          'selectTicket',
          20,
          { showingId: selectSeatDto.showingId },
          { id: newItem.id, ...newItem.data }
        );
      }

      return Ok(true);
    } catch (error) {
      this.slackService.sendError(`Booking Svc >>> selectSeat: ${error.message} with data: ${JSON.stringify(selectSeatDto)}`);
      
      return Err(new Error('Failed to handle showing with select section seatmap'));
    }
  }

  async handleShowingWithSelectSeatSeatmap(
    selectSeatDto: SelectSeatDto,
    email: string,
    seatmap: ShowingSeatMapResponseDto
  ): Promise<Result<Boolean, Error>> {
    try {
      // Check if the seat information is provided
      if (!selectSeatDto.seatInfo || selectSeatDto.seatInfo.length === 0) {
        return Err(new Error('Seat information is required'));
      }

      // Check if one of the seat IDs is be bought in ticket repo
      const seatIds = selectSeatDto.seatInfo.map(seat => seat.seatId);
      const existingTickets = await this.ticketRepository.findOne({
        seatId: { in: seatIds },
        Order: {
          showingId: selectSeatDto.showingId,
        }
      }); 
      if (existingTickets) {
        return Err(new Error('One or more selected seats have already been booked'));
      }

      // Check if one of the seat IDs is not available in the seatmap
      const unavailableSeats = seatmap.Section.flatMap(section =>
        section.Row.flatMap(row =>
          row.Seat.filter(seat =>
            seatIds.includes(seat.id) && seat.status !== SeatStatusEnum.AVAILABLE
          )
        )
      );
      if (unavailableSeats.length > 0) {
        return Err(new Error('One or more selected seats are not available'));
      }

      // Check if one of the seat IDs is select in the cache
      const data = await this.fileCacheService.getCacheObject(
        'selectSeat',
        {
          showingId: selectSeatDto.showingId,
        }
      ) as AggregatedSelectSeatItem[] | null;

      if (data && data.length > 0) {
        const cachedSeatIds = new Set<number>();
        
        for (const item of data) {
          item.data.seatId.forEach(id => { if (item.data.userId != email) cachedSeatIds.add(id)});
        }

        const conflict = seatIds.find(id => cachedSeatIds.has(id));
        if (conflict) {
          return Err(new Error(`Seat ${conflict} is currently being selected by another user`));
        }
      }

      // Create a new entry for the selected seats
      const newSeatData: SelectSeatData = {
        userId: email,
        seatId: seatIds,
      };

      const newItem: AggregatedSelectSeatItem = {
        id: `${email}`,
        timestamp: Date.now(),
        timeout: 20, // Cache timeout in minutes
        data: newSeatData,
      };
      await this.fileCacheService.cacheObject(
        'selectSeat',
        20,
        { showingId: selectSeatDto.showingId },
        { id: newItem.id, ...newItem.data }
      );
      return Ok(true);
      
    } catch (error) {
      this.slackService.sendError(`Booking Svc >>> selectSeat: ${error.message} with data: ${JSON.stringify(selectSeatDto)}`);
      
      return Err(new Error('Failed to handle showing with select seat seatmap'));
    }
  }
}