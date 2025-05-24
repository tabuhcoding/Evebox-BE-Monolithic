import { Inject, Injectable } from "@nestjs/common";
import { SlackService } from "src/infrastructure/adapters/slack/slack.service";
import { GetTotalTicketOfTicketTypeService } from "src/services/booking-svc/modules/queries/getTotalTicketOfTicketType/getTotalTicketOfTicketType.service";
import { SeatmapRepository } from "src/services/event-svc/repository/seatmap/seatmap.repo";
import { SeatStatusRepository } from "src/services/event-svc/repository/seatStatus/seatStatus.repo";
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

  async reCalculateAllTicketTypesOfShowingStatus(showing: Showing) {
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
        await this.reCalculateTicketTypeStatus(ticketType.id, seatmapType);
      }
      
      return;
    }
    catch (error) {
      this.slackService.sendError(`Event Svc - Event >>> reCalculateShowingStatus: ${error.message}`);
      return undefined;
    }
  }

  async reCalculateTicketTypeStatus(ticketTypeId: string, seatmapType: SeatmapType) {
    try{
      // Find ticket type by id
      const ticketType = await this.ticketTypeRepository.findOneById(ticketTypeId, {
      });

      if (!ticketType) {

        return;
      }
      
      // Normal check
      const now = new Date();
      if (ticketType.startTime > now) {
        ticketType.status = TicketTypeStatus.NOT_OPEN;
        return;
      }

      if (ticketType.endTime < now) {
        ticketType.status = ticketType.isFree ? TicketTypeStatus.REGISTER_CLOSED : TicketTypeStatus.SALE_CLOSED;
        return;
      }
      
      // Seatmap is not a seatmap
      if (seatmapType === SeatmapType.NOT_A_SEATMAP) {
        // Get total ticket of ticket type
        const totalTickets = await this.getTotalTicketOfTicketTypeService.getTotalTicketOfTicketType(ticketType.id);
        if (totalTickets === null) {
          this.slackService.sendError(`Booking Svc >>> reCalculateTicketTypeStatus: Failed to get total tickets for ticket type ${ticketType.id}`);
          ticketType.status = TicketTypeStatus.NOT_OPEN

          return;
        }

        if (totalTickets < ticketType.quantity && ticketType.quantity > 0)
          ticketType.status = ticketType.isFree ? TicketTypeStatus.REGISTER_NOW : TicketTypeStatus.BOOK_NOW
        else 
          ticketType.status = TicketTypeStatus.SOLD_OUT;

        return;
      }

      // Seatmap is a Select section seatmap
      if (seatmapType === SeatmapType.SELECT_SECTION) {
        // Get all ticket type sections
        const ticketTypeSections = await this.ticketTypeSectionRepository.findMany({
          where: {
            ticketTypeId: ticketType.id,
          },
        });

        if (!ticketTypeSections || ticketTypeSections.length === 0) {
          this.slackService.sendError(`Event Svc - Event >>> reCalculateTicketTypeStatus: No ticket type sections found for ticket type ${ticketType.id}`);
          ticketType.status = TicketTypeStatus.NOT_OPEN;
          return;
        }

        for (const ticketTypeSection of ticketTypeSections) {
          // Get total ticket of section
          const totalTickets = await this.getTotalTicketOfTicketTypeService.getTotalTicketOfSection(ticketType.id, ticketTypeSection.sectionId);
          if (totalTickets === null) {
            this.slackService.sendError(`Booking Svc >>> reCalculateTicketTypeStatus: Failed to get total tickets for ticket type ${ticketType.id} and section ${ticketTypeSection.sectionId}`);
            ticketType.status = TicketTypeStatus.NOT_OPEN;
            return;
          }

          if (totalTickets < ticketTypeSection.quantity && ticketTypeSection.quantity > 0) {
            ticketType.status = ticketType.isFree ? TicketTypeStatus.REGISTER_NOW : TicketTypeStatus.BOOK_NOW;

            return;
          } else {
            ticketType.status = TicketTypeStatus.SOLD_OUT;
          }
        }

        return;
      }

      // Seatmap is a Select seat seatmap
      if (seatmapType === SeatmapType.SELECT_SEAT) {
        // Get all ticket type sections
        const ticketTypeSections = await this.ticketTypeSectionRepository.findMany({
          where: {
            ticketTypeId: ticketType.id,
          },
        });

        if (!ticketTypeSections || ticketTypeSections.length === 0) {
          this.slackService.sendError(`Event Svc - Event >>> reCalculateTicketTypeStatus: No ticket type sections found for ticket type ${ticketType.id}`);
          ticketType.status = TicketTypeStatus.NOT_OPEN;
          return;
        }

        // Get all seatStatus of sections
        const allSeatOfSections = await this.seatStatusRepository.findMany({
          where: {
            Seat: {
              Row: {
                Section: {
                  id: {
                    in: ticketTypeSections.map(section => section.sectionId),
                  }
                }
              }
            }
          }
        });

        if (!allSeatOfSections || allSeatOfSections.length === 0) {
          this.slackService.sendError(`Event Svc - Event >>> reCalculateTicketTypeStatus: No seat status found for ticket type ${ticketType.id}`);
          ticketType.status = TicketTypeStatus.NOT_OPEN;
          return;
        }

        // Get all seat has sale of ticket type
        const allSeatHasSale = await this.getTotalTicketOfTicketTypeService.getAllSeatHasSaleOfTicketType(ticketType.id);

        if (allSeatHasSale === null) {
          this.slackService.sendError(`Booking Svc >>> reCalculateTicketTypeStatus: Failed to get all seat has sale for ticket type ${ticketType.id}`);
          ticketType.status = TicketTypeStatus.NOT_OPEN;
          return;
        }

        // compare all seat status is available with all seat has sale

        const allSeatStatusAvailable = allSeatOfSections.filter(seatStatus => 
          seatStatus.status === 'AVAILABLE' && 
          !allSeatHasSale.includes(seatStatus.seatId)
        );

        if (allSeatStatusAvailable.length > 0) {
          ticketType.status = ticketType.isFree ? TicketTypeStatus.REGISTER_NOW : TicketTypeStatus.BOOK_NOW;
        } else {
          ticketType.status = TicketTypeStatus.SOLD_OUT;
        }
        return;
      }

      // If seatmap type is not recognized, set status to NOT_OPEN
      this.slackService.sendError(`Event Svc - Event >>> reCalculateTicketTypeStatus: Unrecognized seatmap type for ticket type ${ticketType.id}`);
      ticketType.status = TicketTypeStatus.NOT_OPEN;
    }
    catch (error) {
      this.slackService.sendError(`Event Svc - Event >>> reCalculateTicketTypeStatus: ${error.message}`);
      return undefined;
    }
  }
}