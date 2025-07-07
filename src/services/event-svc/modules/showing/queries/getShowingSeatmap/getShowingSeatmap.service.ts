import { Injectable, Inject } from '@nestjs/common';
import { Result, Ok, Err } from 'oxide.ts';
import { SlackService } from 'src/infrastructure/adapters/slack/slack.service';
import { SeatmapRepository } from 'src/services/event-svc/repository/seatmap/seatmap.repo';
import { ShowingRepository } from 'src/services/event-svc/repository/showing/showing.repo';
import { getSeatmapType, SeatmapType } from 'src/shared/utils/status/seatmap';
import { CalculateSectionStatusService } from '../../command/calculateSectionStatus/calculateSectionStatus.service';
import { GetTotalTicketOfTicketTypeService } from 'src/services/booking-svc/modules/queries/getTotalTicketOfTicketType/getTotalTicketOfTicketType.service';
import { SeatStatusEnum } from 'prisma/client-event';
import { ShowingSeatMapResponseDto } from './getShowingSeatmap-response.dto';
import { TicketTypeSectionRepository } from 'src/services/event-svc/repository/ticketTypeSection/ticketTypeSection.repo';

@Injectable()
export class getShowingSeatmapService {
  constructor(
    @Inject('SeatmapRepository') private readonly seatmapRepository: SeatmapRepository,
    @Inject('ShowingRepository') private readonly showingRepository: ShowingRepository,
    @Inject('TicketTypeSectionRepository') private readonly ticketTypeSectionRepository: TicketTypeSectionRepository,
    private readonly slackService: SlackService,
    private readonly getSectionStatusService: CalculateSectionStatusService,
    private readonly getTotalTicketOfTicketTypeService: GetTotalTicketOfTicketTypeService,
  ) {}

  async getSeatMap(showingId: string): Promise<Result<ShowingSeatMapResponseDto, Error>> {
    try {
      // Fetch the showing details
      const showing = await this.showingRepository.findOneById(showingId,
        {
          TicketType: true,
        }
      )
      if (!showing) {
        return Err(new Error('Showing not found.'));
      }

      // Fetch the seatmap associated with the showing
      const seatmap = await this.seatmapRepository.findOneById(showing.seatMapId, {
        Section: {
          include: {
            Row: {
              include: {
                Seat: {
                  include: {
                    SeatStatus: {
                      where: {
                        showingId: showing.id,
                      }
                    },
                  },
                },
              },
            },
          },
        }
      })

      if (!seatmap) {
        return Err(new Error('Seatmap not found.'));
      }

      // Get seatmap type
      const seatmapType = getSeatmapType(seatmap)

      if (!seatmapType || seatmapType === SeatmapType.NOT_A_SEATMAP){

        return Err(new Error('Invalid seatmap type.'));
      }

      // TicketType Id set
      const ticketTypeIds = showing.TicketType.map(ticketType => ticketType.id as string);
      // if SeatmapType is Select Section

      // Calculate section status
      if( seatmapType === SeatmapType.SELECT_SECTION) {
        const formattedSeatmap: ShowingSeatMapResponseDto = {
          ...seatmap,
          Section: seatmap.Section?.map(section => ({
            ...section,
            status: null,
            ticketTypeId: null,
          })),
          seatMapType: seatmapType,
        };
        for (const section of formattedSeatmap.Section) {
          [section.status, section.ticketTypeId] = await this.getSectionStatusService.calculateSectionStatus(ticketTypeIds, section.id);
        }
        return Ok(formattedSeatmap);
      }

      // If SeatmapType is Select Seat
      if (seatmapType === SeatmapType.SELECT_SEAT) {
        // Get all sold seats for the showing
        const allSoldSeats = await this.getTotalTicketOfTicketTypeService.getAllSeatHasSaleOfShowing(showingId);
        if (allSoldSeats === null) {
          await this.slackService.sendError(`Booking Svc >>> getShowingSeatmap: Failed to get all sold seats for showing ${showingId}`);
          
          return Err(new Error('Failed to fetch seatmap.'));
        }

        const allPickedSeats = await this.getTotalTicketOfTicketTypeService.getAllSeatHasPickedInCacheOfShowing(showingId);
        if (allPickedSeats === null) {
          await this.slackService.sendError(`Booking Svc >>> getShowingSeatmap: Failed to get all picked seats for showing ${showingId}`);
          
          return Err(new Error('Failed to fetch seatmap.'));
        }

        // Get all ticket type sections
        const ticketTypeSections = await this.ticketTypeSectionRepository.findMany({
          ticketTypeId: { in: ticketTypeIds },
        });
        // Map ticket type sections to a set for quick lookup
        const ticketTypeSectionMap = new Map(ticketTypeSections.map(section => [section.sectionId, section.ticketTypeId]));

        // Format the seatmap
        const formattedSeatmap: ShowingSeatMapResponseDto = {
          ...seatmap,
          Section: seatmap.Section?.map(section => ({
            ...section,
            status: null,
            ticketTypeId: ticketTypeSectionMap.get(section.id) || null,
            Row: section.Row?.map(row => ({
              ...row,
              Seat: row.Seat?.map(seat => ({
                ...seat,
                SeatStatus: null,
                status: allSoldSeats.includes(seat.id) ? SeatStatusEnum.ESOLD : allPickedSeats.includes(seat.id) ? SeatStatusEnum.INCACHE : seat.SeatStatus?.[0]?.status || null,
              })),
            })),
          })),
          seatMapType: seatmapType,
        };

        return Ok(formattedSeatmap);
      }
      
      return Err(new Error('Unsupported seatmap type.'));
    } catch (error) {
      await this.slackService.sendError(`Event Svc >>> getShowingSeatmap: ${error.message}`);
      return Err(new Error('Failed to fetch seat map data.'));
    }
  }

  async getSeatMapType(showingId: string): Promise<SeatmapType> {
    try {
      // Fetch the showing details
      const showing = await this.showingRepository.findOneById(showingId, {
        select: {
          seatMapId: true,
        },
      });

      if (!showing) {
        throw new Error('Showing not found.');
      }

      // Fetch the seatmap associated with the showing
      const seatmap = await this.seatmapRepository.findOneById(showing.seatMapId);

      if (!seatmap) {
        throw new Error('Seatmap not found.');
      }

      // Get seatmap type
      return getSeatmapType(seatmap);
    } catch (error) {
      await this.slackService.sendError(`Event Svc >>> getShowingSeatmap: ${error.message}`);
      throw new Error('Failed to fetch seat map type.');
    }
  }

}