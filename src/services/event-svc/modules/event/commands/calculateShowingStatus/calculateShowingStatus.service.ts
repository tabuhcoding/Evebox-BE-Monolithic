import { Inject, Injectable } from "@nestjs/common";
import { Ticket } from "@prisma/client";
import { SlackService } from "src/infrastructure/adapters/slack/slack.service";
import { GetTotalTicketOfTicketTypeService } from "src/services/booking-svc/modules/queries/getTotalTicketOfTicketType/getTotalTicketOfTicketType.service";
import { SeatmapRepository } from "src/services/event-svc/repository/seatmap/seatmap.repo";
import { SeatStatusEnum, SeatStatusRepository } from "src/services/event-svc/repository/seatStatus/seatStatus.repo";
import { Showing } from "src/services/event-svc/repository/showing/showing.repo";
import { TicketTypeRepository, TicketTypeStatus } from "src/services/event-svc/repository/ticketType/ticketType.repo";
import { TicketTypeSectionRepository } from "src/services/event-svc/repository/ticketTypeSection/ticketTypeSection.repo";
import { getSeatmapType, SeatmapType } from "src/shared/utils/status/seatmap";

@Injectable()
export class CalculateShowingStatusService {
  constructor(
    @Inject('SeatmapRepository') private readonly seatmapRepository: SeatmapRepository,
    @Inject('TicketTypeSectionRepository') private readonly ticketTypeSectionRepository: TicketTypeSectionRepository,
    @Inject('SeatStatusRepository') private readonly seatStatusRepository: SeatStatusRepository,
    @Inject('TicketTypeRepository') private readonly ticketTypeRepository: TicketTypeRepository,
    private readonly slackService: SlackService,
    private readonly getTotalTicketOfTicketTypeService: GetTotalTicketOfTicketTypeService,
  ) {}

  async reCalculateAllTicketTypesOfShowingStatus(showing: Showing, withRedisStatus: boolean = false) {
    if (showing.id.includes('showing-') || showing.endTime < new Date()) {
      for (const ticketType of showing.TicketType) {
        ticketType.status = TicketTypeStatus.SALE_CLOSED;
      }

      return;
    }
    
    try{
      // find seatmap by id
      const seatmap = await this.seatmapRepository.findOneById(showing.seatMapId, {
        Section: {
          include: {
            Row: {
              include: {
                Seat: {
                  include: {
                    SeatStatus: true
                  }
                }
              }
            }
          }
        }
      })

      // get seatmap type
      const seatmapType = getSeatmapType(seatmap);
      
      // update ticket type status
      for (const ticketType of showing.TicketType) {
        const newStatus = await this.reCalculateTicketTypeStatus(ticketType.id as string, seatmapType, withRedisStatus);
        if (newStatus !== undefined) {
          ticketType.status = newStatus;
        }
      }
      
      return;
    }
    catch (error) {
      await this.slackService.sendError(`Event Svc - Event >>> reCalculateShowingStatus: ${error.message}`);
      return undefined;
    }
  }

  async reCalculateTicketTypeStatus(ticketTypeId: string, seatmapType: SeatmapType, withRedisStatus: boolean = false): Promise<TicketTypeStatus | undefined> {
    try{
      // Find ticket type by id
      const ticketType = await this.ticketTypeRepository.findOneById(ticketTypeId, {
      });

      if (!ticketType) {

        return undefined;
      }
      
      // Normal check
      const now = new Date();
      if (ticketType.startTime > now) {
        ticketType.status = TicketTypeStatus.NOT_OPEN;

        return ticketType.status;
      }

      if (ticketType.endTime < now) {
        ticketType.status = ticketType.isFree ? TicketTypeStatus.REGISTER_CLOSED : TicketTypeStatus.SALE_CLOSED;

        return ticketType.status;
      }
      
      // Seatmap is not a seatmap
      if (seatmapType === SeatmapType.NOT_A_SEATMAP) {
        // Get total ticket of ticket type
        const totalTickets = await this.getTotalTicketOfTicketTypeService.getTotalTicketOfTicketType(ticketType.id);
        if (totalTickets === null) {
          await this.slackService.sendError(`Booking Svc >>> reCalculateTicketTypeStatus: Failed to get total tickets for ticket type ${ticketType.id}`);
          ticketType.status = TicketTypeStatus.NOT_OPEN

          return ticketType.status;
        }

        if (totalTickets < ticketType.quantity && ticketType.quantity > 0)
          ticketType.status = ticketType.isFree ? TicketTypeStatus.REGISTER_NOW : TicketTypeStatus.BOOK_NOW
        else 
          ticketType.status = TicketTypeStatus.SOLD_OUT;

        return ticketType.status;
      }

      // Seatmap is a Select section seatmap
      if (seatmapType === SeatmapType.SELECT_SECTION) {
        // Get all ticket type sections
        const ticketTypeSections = await this.ticketTypeSectionRepository.findMany({
          ticketTypeId: ticketType.id,
        });

        if (!ticketTypeSections || ticketTypeSections.length === 0) {
          await this.slackService.sendError(`Event Svc - Event >>> reCalculateTicketTypeStatus: No ticket type sections found for ticket type ${ticketType.id}`);
          ticketType.status = TicketTypeStatus.NOT_OPEN;
          return ticketType.status;
        }

        for (const ticketTypeSection of ticketTypeSections) {
          // Get total ticket of section
          const totalTickets = await this.getTotalTicketOfTicketTypeService.getTotalTicketOfSection(ticketType.id, ticketTypeSection.sectionId);
          if (totalTickets === null) {
            await this.slackService.sendError(`Booking Svc >>> reCalculateTicketTypeStatus: Failed to get total tickets for ticket type ${ticketType.id} and section ${ticketTypeSection.sectionId}`);
            ticketType.status = TicketTypeStatus.NOT_OPEN;
            return ticketType.status;
          }

          if (totalTickets < ticketTypeSection.quantity && ticketTypeSection.quantity > 0) {
            ticketType.status = ticketType.isFree ? TicketTypeStatus.REGISTER_NOW : TicketTypeStatus.BOOK_NOW;

            return ticketType.status;
          } else {
            ticketType.status = TicketTypeStatus.SOLD_OUT;
          }
        }

        return ticketType.status;
      }

      // Seatmap is a Select seat seatmap
      if (seatmapType === SeatmapType.SELECT_SEAT) {
        // Get all ticket type sections
        const ticketTypeSections = await this.ticketTypeSectionRepository.findMany({
          ticketTypeId: ticketType.id,
        });

        if (!ticketTypeSections || ticketTypeSections.length === 0) {
          await this.slackService.sendError(`Event Svc - Event >>> reCalculateTicketTypeStatus: No ticket type sections found for ticket type ${ticketType.id}`);
          ticketType.status = TicketTypeStatus.NOT_OPEN;
          return ticketType.status;
        }

        // Get all seatStatus of sections
        const allSeatOfSections = await this.seatStatusRepository.findMany({
          Seat: {
            Row: {
              Section: {
                id: {
                  in: ticketTypeSections.map(section => section.sectionId),
                }
              }
            }
          },
          showingId: ticketType.showingId,
        });


        if (!allSeatOfSections || allSeatOfSections.length === 0) {
          await this.slackService.sendError(`Event Svc - Event >>> reCalculateTicketTypeStatus: No seat status found for ticket type ${ticketType.id}`);
          ticketType.status = TicketTypeStatus.NOT_OPEN;
          return ticketType.status;
        }

        // Get all seat has sale of ticket type
        var allSeatHasSale = await this.getTotalTicketOfTicketTypeService.getAllSeatHasSaleOfTicketType(ticketType.id);

        if (allSeatHasSale === null) {
          await this.slackService.sendError(`Booking Svc >>> reCalculateTicketTypeStatus: Failed to get all seat has sale for ticket type ${ticketType.id}`);
          ticketType.status = TicketTypeStatus.NOT_OPEN;
          return ticketType.status;
        }

        // Get all seat has picked in cache if withRedisStatus is true
        if (withRedisStatus) {
          const allSeatHasPicked = await this.getTotalTicketOfTicketTypeService.getAllSeatHasSaleOfShowing(ticketType.showingId);
          if (allSeatHasPicked === null) {
            await this.slackService.sendError(`Booking Svc >>> reCalculateTicketTypeStatus: Failed to get all seat has picked for showing ${ticketType.showingId}`);
            ticketType.status = TicketTypeStatus.NOT_OPEN;
            return ticketType.status;
          }

          allSeatHasSale = [...allSeatHasSale, ...allSeatHasPicked];
        }

        // compare all seat status is available with all seat has sale
        // Check if there are any available seats that are not sold
        const seatStatusAvailable = allSeatOfSections.some(seatStatus => seatStatus.status === SeatStatusEnum.AVAILABLE )
        
        if (!seatStatusAvailable)
        {
          ticketType.status = TicketTypeStatus.SOLD_OUT;
          return ticketType.status;
        }

        const allSeatStatusAvailable = allSeatOfSections.filter(seatStatus => 
          seatStatus.status === 'AVAILABLE' && 
          !allSeatHasSale.includes(seatStatus.seatId)
        );

        if (allSeatStatusAvailable.length > 0) {
          ticketType.status = ticketType.isFree ? TicketTypeStatus.REGISTER_NOW : TicketTypeStatus.BOOK_NOW;
        } else {
          ticketType.status = TicketTypeStatus.SOLD_OUT;
        }

        return ticketType.status;
      }

      // If seatmap type is not recognized, set status to NOT_OPEN
      await this.slackService.sendError(`Event Svc - Event >>> reCalculateTicketTypeStatus: Unrecognized seatmap type for ticket type ${ticketType.id}`);
      ticketType.status = TicketTypeStatus.NOT_OPEN;
      return ticketType.status;
    }
    catch (error) {
      await this.slackService.sendError(`Event Svc - Event >>> reCalculateTicketTypeStatus: ${error.message}`);
      return undefined;
    }
  }
}