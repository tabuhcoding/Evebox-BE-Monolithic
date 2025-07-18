import { Inject, Injectable } from '@nestjs/common';
import { Result, Ok, Err } from 'oxide.ts';
import { Seatmap, SeatmapRepository } from 'src/services/event-svc/repository/seatmap/seatmap.repo';
import { ShowingRepository } from 'src/services/event-svc/repository/showing/showing.repo';
import { TicketTypeSectionRepository } from 'src/services/event-svc/repository/ticketTypeSection/ticketTypeSection.repo';

@Injectable()
export class getAllShowingService {
  constructor(
    @Inject('ShowingRepository') private readonly showingRepository: ShowingRepository,
    @Inject('SeatmapRepository') private readonly seatmapRepository: SeatmapRepository,
    @Inject('TicketTypeSectionRepository') private readonly ticketTypeSectionRepository: TicketTypeSectionRepository,
  ) {}

  async getAllShowings(): Promise<Result<String[], Error>> {
    try {
      const showings = await this.showingRepository.findMany({});
      const formattedResult = showings.map(showing => showing.id);
      return Ok(formattedResult);
    } catch (error) {
      console.error(error);
      return Err(new Error('Failed to fetch showings data.'));
    }
  }

  async getAllSeatmap(): Promise<Result<Seatmap[], Error>> {
    try {
      const seatmaps = await this.seatmapRepository.findMany({
        id: { not: 0}
      });
      return Ok(seatmaps);
    } catch (error) {
      console.error(error);
      return Err(new Error('Failed to fetch seatmaps data.'));
    }
  }

  async getSeatmapWithSection(id: number): Promise<Result<Seatmap, Error>> {
    try {
      const seatmap = await this.seatmapRepository.findOneById(id, {
        Section: true,
      });
      if (!seatmap) {
        return Err(new Error('Seatmap not found.'));
      }
      return Ok(seatmap);
    } catch (error) {
      console.error(error);
      return Err(new Error('Failed to fetch seatmap data.'));
    }
  }

  async connectShowingToSeatmap(
    showingId: string,
    seatmapId: string,
    ticketTypeSectionMap: Record<string, number[]>
  ): Promise<Result<void, Error>> {
    try {
      const showing = await this.showingRepository.findOneById(showingId, {
        TicketType: true,
      });
      if (!showing) {
        return Err(new Error('Showing not found.'));
      }

      const seatmap = await this.seatmapRepository.findOneById(seatmapId, {
        Section: true,
      });
      if (!seatmap) {
        return Err(new Error('Seatmap not found.'));
      }

      // Update the showing with the seatmap and ticket type section map
      const ticketTypeIds = Object.keys(ticketTypeSectionMap);
      const sections = Object.values(ticketTypeSectionMap);
      ticketTypeIds.forEach(ticketTypeId => {
        if (!showing.TicketType.some(tt => tt.id === ticketTypeId)) {
          return Err(new Error(`Ticket type ${ticketTypeId} not found in showing.`));
        }
      });
      sections.forEach(sectionArray => {
        sectionArray.forEach(sectionId => {
          if (!seatmap.Section.some(s => s.id === sectionId)) {
            return Err(new Error(`Section ${sectionId} not found in seatmap.`));
          }
        });
      });

      await this.showingRepository.updateOneById(showingId, {
        seatMapId: seatmapId,
      });

      await this.ticketTypeSectionRepository.deleteHardMany({
        ticketTypeId: { in: ticketTypeIds },
      });

      for (const [ticketTypeId, sectionIds] of Object.entries(ticketTypeSectionMap)) {
        for (const sectionId of sectionIds) {
          await this.ticketTypeSectionRepository.insertOne({
              ticketTypeId: ticketTypeId,
              sectionId: sectionId,
          });
        }
      }
      
      return Ok(undefined);
    } catch (error) {
      console.error(error);
      return Err(new Error('Failed to connect showing to seatmap.'));
    }
  }
}