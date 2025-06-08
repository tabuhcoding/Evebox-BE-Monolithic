import { Inject, Injectable } from '@nestjs/common';
import { Result, Ok, Err } from 'oxide.ts';
import { ShowingDataDto, SimpleShowingDataDto } from './getShowingDetail-response.dto';
import { ShowingRepository } from 'src/services/event-svc/repository/showing/showing.repo';
import { CalculateShowingStatusService } from '../../../event/commands/calculateShowingStatus/calculateShowingStatus.service';
import { calculateShowingStatusAndMinPrice, ShowingStatus } from 'src/shared/utils/status/status';
import { EventsRepository } from 'src/services/event-svc/repository/events/events.repo';

@Injectable()
export class getShowingDetailService {
  constructor(
    @Inject('ShowingRepository') private readonly showingRepository: ShowingRepository,
    @Inject('EventsRepository') private readonly eventsRepository: EventsRepository,
    private readonly calculateShowingStatusService: CalculateShowingStatusService, 
  ) {}

  async execute(showingId: string): Promise<Result<ShowingDataDto, Error>> {
    try {
      // Find showing with ticketType by ID

      if (!showingId) {
        return Err(new Error('Showing ID is required.'));
      }

      const showing = await this.showingRepository.findOne({
        id: showingId,
      }, {
        TicketType: true,
      });

      if (!showing) {
        return Err(new Error('Showing not found.'));
      }

      // find event of showing
      const event = await this.eventsRepository.findOneById(showing.eventId)

      // Calculate showing status and minimum price
      if (!showing.TicketType || showing.TicketType.length === 0) {
        const formattedResult: ShowingDataDto = {
          ...showing,
          status: ShowingStatus.NOT_OPEN,
          minPrice: 0,
          Events: {
            id: event.id,
            title: event.title,
            imgLogoUrl: event.imgLogoUrl,
            imgPosterUrl: event.imgPosterUrl,
            venue: event.venue,
          },
        };

        return Ok(formattedResult);
      }

      await this.calculateShowingStatusService.reCalculateAllTicketTypesOfShowingStatus(showing);
      const [showingStatus, showingMinPrice] = await calculateShowingStatusAndMinPrice(showing.TicketType);

      const formattedResult: ShowingDataDto = {
        ...showing,
        TicketType: showing.TicketType.map(ticketType => ({
          id: ticketType.id,
          name: ticketType.name,
          description: ticketType.description,
          color: ticketType.color,
          isFree: ticketType.isFree,
          price: ticketType.price,
          originalPrice: ticketType.originalPrice,
          maxQtyPerOrder: ticketType.maxQtyPerOrder,
          minQtyPerOrder: ticketType.minQtyPerOrder,
          startTime: ticketType.startTime,
          endTime: ticketType.endTime,
          position: ticketType.position,
          status: ticketType.status,
          imageUrl: ticketType.imageUrl,
          isHidden: ticketType.isHidden,
        })),
        status: showingStatus,
        minPrice: showingMinPrice,
        Events: {
          id: event.id,
          title: event.title,
          imgLogoUrl: event.imgLogoUrl,
          imgPosterUrl: event.imgPosterUrl,
          venue: event.venue,
        },
      };

      return Ok(formattedResult);
      
    } catch (error) {
      console.error(error);
      return Err(new Error('Failed to fetch showing data.'));
    }
  }

  async executeSimple(showingId: string): Promise<Result<SimpleShowingDataDto, Error>> {
    try {
      if (!showingId) {
        return Err(new Error('Showing ID is required.'));
      }

      const showing = await this.showingRepository.findOneById(showingId);

      if (!showing) {
        return Err(new Error('Showing not found.'));
      }

      return Ok(showing);
    } catch (error) {
      console.error(error);
      return Err(new Error('Failed to fetch showing data.'));
    }
  }
}