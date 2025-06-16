import { Inject, Injectable } from "@nestjs/common";
import { SlackService } from "src/infrastructure/adapters/slack/slack.service";
import { SeatmapRepository } from "src/services/event-svc/repository/seatmap/seatmap.repo";
import { SeatRepository } from "src/services/event-svc/repository/seatRepository/seatRepository.repo";
import { SeatStatusEnum, SeatStatusRepository } from "src/services/event-svc/repository/seatStatus/seatStatus.repo";
import { TicketType, TicketTypeRepository } from "src/services/event-svc/repository/ticketType/ticketType.repo";
import { TicketTypeSectionRepository } from "src/services/event-svc/repository/ticketTypeSection/ticketTypeSection.repo";

@Injectable()
export class GetTicketTypeDetailService {
  constructor(
    private readonly slackService: SlackService,
    @Inject('TicketTypeRepository') private readonly ticketTypeRepository: TicketTypeRepository,
    @Inject('TicketTypeSectionRepository') private readonly ticketTypeSectionRepository: TicketTypeSectionRepository,
    @Inject('SeatmapRepository') private readonly seatmapRepository: SeatmapRepository,
    @Inject("SeatStatusRepository") private readonly seatStatusRepository: SeatStatusRepository,
    @Inject('SeatRepository') private readonly seatRepository: SeatRepository,
  ){}

  async getTicketTypeDetail(ticketTypeId: string): Promise<TicketType | null> {
    try{
      const ticketType = await this.ticketTypeRepository.findOneById(ticketTypeId,
        {
          Showing: true,
          sections: true,
        }
      );
      if (!ticketType) {

        return null;
      }
      return ticketType;
    } catch (error) {
      await this.slackService.sendError(`Event Svc >>> getTicketTypeDetail: ${error.message}`);
      
      return null;
    }
  }

  async getTicketTypeSection(ticketTypeId: string, sectionId: number): Promise<any | null> {
    try {
      const ticketTypeSection = await this.ticketTypeSectionRepository.findOne({
        ticketTypeId: ticketTypeId,
        sectionId: sectionId,
      }, {
        TicketType: true,
        Section: true,
      })

      if (!ticketTypeSection || !ticketTypeSection.Section) {
        return null;
      }

      return ticketTypeSection;
    } catch (error) {
      await this.slackService.sendError(`Event Svc >>> getTicketTypeSection: ${error.message} with ticketTypeId: ${ticketTypeId}, sectionId: ${sectionId}`);
      return null;
    }
  }

  async getTicketTypeSectionname(ticketTypeId: string, sectionId: number): Promise<string | null> {
    try {
      const ticketTypeSection = await this.ticketTypeSectionRepository.findOne({
        ticketTypeId: ticketTypeId,
        sectionId: sectionId,
      }, {
        // TicketType: true,
        Section: true,
      })

      if (!ticketTypeSection || !ticketTypeSection.Section) {
        return null;
      }

      return ticketTypeSection.Section.name.replace(/"/g, '');
    } catch (error) {
      await this.slackService.sendError(`Event Svc >>> getTicketTypeSectionname: ${error.message} with ticketTypeId: ${ticketTypeId}, sectionId: ${sectionId}`);
      
      return null;
    }
  }

  async getSeatSectionName(ticketTypeId: string, seatId: number): Promise<[string | null, string | null]> {
    try {
      const ticketType = await this.ticketTypeRepository.findOneById(ticketTypeId,
        {
          Showing: true,
          sections: true,
        }
      );
      if (!ticketType) {

        return null;
      }

      const seat = await this.seatRepository.findOneById(seatId, {
        Row: {
          include: {
            Section: {
              include: {
                Seatmap: true,
              },
            },
          },
        },
      });
      
      const sectionname = seat?.Row?.Section?.name?.replace(/"/g, '') || null;
      const seatname = seat ? `${seat.Row.name}-${seat.name}`.replace(/"/g, '') : null;


      return [seatname, sectionname];
    } catch (error) {
      await this.slackService.sendError(`Event Svc >>> getSeatSectionName: ${error.message} with ticketTypeId: ${ticketTypeId}, sectionId: ${seatId}`);
      
      return [null, null];
    }
  }

  async checkSeatIdIsNotBeenLocked(showingId: string, seatIds: number[]): Promise<boolean> {
    try {
      const seatStatus = await this.seatStatusRepository.findAll({
        showingId: showingId,
        seatId: { in: seatIds },
        status: { notIn: [SeatStatusEnum.NOTSALE, SeatStatusEnum.SOLD] }
      });
      if (!seatStatus || seatStatus.length === 0) {
        return false;
      }
      return true;
    } catch (error) {
      await this.slackService.sendError(`Event Svc >>> checkSeatIdIsNotBeenLocked: ${error.message} with showingId: ${showingId}, seatId: ${seatIds}`);
      
      return false;
    }
  }

  async setSeatStatusToESold(showingId: string, seatIds: number[]): Promise<void> {
    try {
      await this.seatStatusRepository.updateMany({
        showingId: showingId,
        seatId: { in: seatIds},
      }, {
        status: SeatStatusEnum.ESOLD,
      })
    } catch (error) {
      await this.slackService.sendError(`Event Svc >>> setSeatStatusToESold: ${error.message} with showingId: ${showingId}, seatId: ${seatIds}`);
      
      throw new Error(`Failed to set seat status to sold: ${error.message}`);
    }
  }
}