import { Inject, Injectable } from '@nestjs/common';
import { Result, Ok, Err, None } from 'oxide.ts';
import { SlackService } from 'src/infrastructure/adapters/slack/slack.service';
import { Seatmap, SeatmapRepository } from 'src/services/event-svc/repository/seatmap/seatmap.repo';
import { ShowingRepository } from 'src/services/event-svc/repository/showing/showing.repo';
import { TicketTypeSectionRepository } from 'src/services/event-svc/repository/ticketTypeSection/ticketTypeSection.repo';
import { ConnectShowingToSeatmapDTO } from './getAllShowing-response.dto';
import { SeatMapResponseDto, ShowingSeatMapResponseDto } from '../getShowingSeatmap/getShowingSeatmap-response.dto';
import { getSeatmapType, SeatmapType, SectionStatus } from 'src/shared/utils/status/seatmap';
import { SeatStatusEnum, SeatStatusRepository } from 'src/services/event-svc/repository/seatStatus/seatStatus.repo';
import { CalculateSectionStatusService } from '../../command/calculateSectionStatus/calculateSectionStatus.service';
import { GetTotalTicketOfTicketTypeService } from 'src/services/booking-svc/modules/queries/getTotalTicketOfTicketType/getTotalTicketOfTicketType.service';

@Injectable()
export class getAllShowingService {
  constructor(
    @Inject('ShowingRepository') private readonly showingRepository: ShowingRepository,
    @Inject('SeatmapRepository') private readonly seatmapRepository: SeatmapRepository,
    private readonly getSectionStatusService: CalculateSectionStatusService,
    private readonly getTotalTicketOfTicketTypeService: GetTotalTicketOfTicketTypeService,
    @Inject('TicketTypeSectionRepository') private readonly ticketTypeSectionRepository: TicketTypeSectionRepository,
    @Inject('SeatStatusRepository') private readonly seatStatusRepository: SeatStatusRepository,
    private readonly slackService: SlackService
  ) {}

  async getAllShowings(): Promise<Result<String[], Error>> {
    try {
      const showings = await this.showingRepository.findMany({});
      const formattedResult = showings.map(showing => showing.id);
      return Ok(formattedResult);
    } catch (error) {
      await this.slackService.sendError(`Error fetching showings: ${error.message}`);
      return Err(new Error('Failed to fetch showings data.'));
    }
  }

  async getAllSeatmap(showingID: string): Promise<Result<Seatmap[], Error>> {
    try {
      const showing = await this.showingRepository.findOne({
        id: showingID,
        OR: [
          {
            TicketType: {
              some: {
                startTime: {
                  gte: new Date(),
                }
              }
            } 
          },
          {
            startTime: {
              gte: new Date(),
            }
          }
        ]
      });

      const seatmapId = showing?.seatMapId || null;;
      if (seatmapId){
        const seatmaps = await this.seatmapRepository.findMany({
          AND: [
            {
              id: seatmapId,
            },
            {
              id: { not: 0 },
            }
          ]
        });
        return Ok(seatmaps);
      }

      const seatmaps = await this.seatmapRepository.findMany({
        id: { not: 0},
        Section: { some: { id: { not: undefined }}}
      });
      return Ok(seatmaps);
    } catch (error) {
      await this.slackService.sendError(`Error fetching seatmaps: ${error.message}`);
      return Err(new Error('Failed to fetch seatmaps data.'));
    }
  }

  async getSeatmapWithSection(showingId: string, id: number): Promise<Result<ShowingSeatMapResponseDto, Error>> {
    try {
      const showing = await this.showingRepository.findOneById(showingId, {
        TicketType: true,
      });
      var seatmap = await this.seatmapRepository.findOneById(id, {
        Section: {
          include: {
            Row: {
              include: {
                Seat: {
                  include: {
                    SeatStatus: {
                      where: {
                        showingId: showing.id,
                      },
                    }
                  }
                }
              }
            },
            ticketTypes: {
              include: {
                TicketType: true,
              },
              where: {
                ticketTypeId: {
                  in: showing.TicketType.map(tt => tt.id),
                }
              }
            },
          }
        }
      });
      if (!seatmap) {
        return Err(new Error('Seatmap not found.'));
      }

      const seatmapType = getSeatmapType(seatmap)

      if (showing.seatMapId !== id) {
        const formattedSeatmap: ShowingSeatMapResponseDto = {
          ...seatmap,
          Section: seatmap.Section?.map(section => ({
            ...section,
            status: null,
            ticketTypeId: null,
            Row: section.Row?.map(row => ({
              ...row,
              Seat: row.Seat?.map(seat => ({
                ...seat,
                status: SeatStatusEnum.AVAILABLE,
              })),
            })),
          })),
          seatMapType: seatmapType,
        }

        return Ok(formattedSeatmap);
      }

      if (seatmapType === SeatmapType.SELECT_SECTION) {
        // Fetch all sold and picked seats
        var formattedSeatmap: ShowingSeatMapResponseDto = {
          ...seatmap,
          Section: [],
          seatMapType: seatmapType,
        }
        for (const section of seatmap.Section) {
          console.log(section);
          const soldSeats = section.ticketTypes.length == 1 ? await this.getTotalTicketOfTicketTypeService.getTotalTicketOfSection(section.ticketTypes[0].ticketTypeId, section.id) : 0
          const quantity = section.ticketTypes.length == 1 ? section.ticketTypes[0].quantity : 0;
          formattedSeatmap.Section.push({
            ...section,
            status: quantity > soldSeats ? SectionStatus.AVAILABLE : SectionStatus.SOLD_OUT,
            quantity: quantity,
            sold: soldSeats,
            ticketTypeId: section.ticketTypes.length == 1 ? section.ticketTypes[0].ticketTypeId : null,
            color: section.ticketTypes.length == 1 ? section.ticketTypes[0].TicketType.color : null,
            ticketTypeName: section.ticketTypes.length == 1 ? section.ticketTypes[0].TicketType.name : null,
          });
        }
        return Ok(formattedSeatmap);
      }

      if (seatmapType === SeatmapType.SELECT_SEAT) {
        // Fetch all sold seats for the showing
        const allSoldSeats = await this.getTotalTicketOfTicketTypeService.getAllSeatHasSaleOfShowing(showingId);
        const allPickedSeats = await this.getTotalTicketOfTicketTypeService.getAllSeatHasPickedInCacheOfShowing(showingId);
        if (allPickedSeats === null) {
          await this.slackService.sendError(`Booking Svc >>> getShowingSeatmap: Failed to get all picked seats for showing ${showingId}`);
          
          return Err(new Error('Failed to fetch seatmap.'));
        }
        const formattedSeatmap: ShowingSeatMapResponseDto = {
          ...seatmap,
          Section: seatmap.Section?.map(section => ({
            ...section,
            status: null,
            ticketTypeId: section.ticketTypes.length == 1 ? section.ticketTypes[0].ticketTypeId : null,
            color: section.ticketTypes.length == 1 ? section.ticketTypes[0].TicketType.color : null,
            ticketTypeName: section.ticketTypes.length == 1 ? section.ticketTypes[0].TicketType.name : null,
            Row: section.Row?.map(row => ({
              ...row,
              Seat: row.Seat?.map(seat => ({
                ...seat,
                status: allSoldSeats.includes(seat.id) 
                || allPickedSeats.includes(seat.id)
                || seat.SeatStatus?.[0]?.status in [SeatStatusEnum.ESOLD, SeatStatusEnum.INCACHE, SeatStatusEnum.SOLD]
                  ? SeatStatusEnum.ESOLD : seat.SeatStatus?.[0]?.status || SeatStatusEnum.NOTSALE,
              })),
            })),
          })),
          seatMapType: seatmapType,
        };
        return Ok(formattedSeatmap);
      }
      
      return Ok(null);
    } catch (error) {
      await this.slackService.sendError(`Error fetching seatmap with sections: ${error.message}`);
      return Err(new Error('Failed to fetch seatmap data.'));
    }
  }

  async connectShowingToSeatmap(
    dto: ConnectShowingToSeatmapDTO
  ): Promise<Result<void, Error>> {
    try {
      const showing = await this.showingRepository.findOneById(dto.showingId, {
        TicketType: true,
      });
      if (!showing) {
        return Err(new Error('Showing not found.'));
      }

      const seatmap = await this.seatmapRepository.findOneById(dto.seatmapId >> 0, {
        Section: {
          include: {
            Row: true,
            // ticketTypes: {
            //   include: {
            //     TicketType: true,
            //   },
            //   where: {
            //     ticketTypeId: {
            //       in: showing.TicketType.map(tt => tt.id),
            //     }
            //   }
            // },
          }
        },
      });
      if (!seatmap) {
        return Err(new Error('Seatmap not found.'));
      }

      const seatMapType = getSeatmapType(seatmap);

      await this.seatStatusRepository.deleteHardMany({
        showingId: dto.showingId,
        status: {
          in: [SeatStatusEnum.AVAILABLE, SeatStatusEnum.NOTSALE],
        }
      });
      await this.ticketTypeSectionRepository.deleteHardMany({
        ticketTypeId: {
          in: showing.TicketType.map(tt => tt.id),
        }
      });

      await this.showingRepository.updateOneById(dto.showingId, {
        seatMapId: dto.seatmapId >> 0,
        // seatMapType: seatMapType,
      });

      const ticketTypeSectionMap = dto.ticketTypeSectionMap
      .filter(map => map.ticketTypeId && map.sectionId)
      .map(map => ({
        ticketTypeId: map.ticketTypeId,
        sectionId: map.sectionId >> 0,
        quantity: map.quantity >> 0,
      }));

      await this.ticketTypeSectionRepository.insertMany(ticketTypeSectionMap);

      if (seatMapType === SeatmapType.SELECT_SEAT) {
        const seatStatusMap = dto.seatStatusMap || {};

        const seatStatusEntries = Object.entries(seatStatusMap)
          .filter(([, status]) => status === 'AVAILABLE' || status === 'NOTSALE')
          .map(([seatId, status]) => ({
            showingId: dto.showingId,
            status,
            seatMapId: dto.seatmapId >> 0,
            seatId: Number(seatId),
          }));

        await this.seatStatusRepository.insertMany(seatStatusEntries);
      }


      return Ok(undefined);
    } catch (error) {
      await this.slackService.sendError(`Error connecting showing to seatmap: ${error.message}`);
      return Err(new Error('Failed to connect showing to seatmap.'));
    }
  }
}