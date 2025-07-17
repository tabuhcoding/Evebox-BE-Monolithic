import { Inject, Injectable } from '@nestjs/common';
import { Result, Ok, Err } from 'oxide.ts';
import { UpdateEventAdminDto } from './updateEventAdmin.dto';
import { EventDto } from './updateEventAdmin-response.dto';
import { EVENT_ROLE } from '../../domain/eventRole';
import { EventsRepository } from 'src/services/event-svc/repository/events/events.repo';
import { EventCategoriesRepository } from 'src/services/event-svc/repository/eventCategories/eventCategories.repo';
import { SlackService } from 'src/infrastructure/adapters/slack/slack.service';
import { CheckUserExistService } from 'src/services/auth-svc/modules/user/commands/checkuserExist/checkuserExist.service';
import { NewEventTriggerService } from 'src/services/auth-svc/modules/notice/trigger/newEvent/newEventTrigger.service';
import { CreateEventDto } from '../createEvent/createEvent.dto';

@Injectable()
export class UpdateEventAdminService {
  constructor(
    @Inject('EventCategoriesRepository') private readonly updateEventRepository: EventCategoriesRepository,
    @Inject('EventsRepository') private readonly eventRepository: EventsRepository,
    private readonly slackService: SlackService,
    private readonly checkUserExistService: CheckUserExistService,  
    private readonly newEventTriggerService: NewEventTriggerService,
  ) {}

  async execute(dto: UpdateEventAdminDto, eventId: number, emailStr: string): Promise<Result<EventDto, Error>> {
    const userExists = await this.checkUserExistService.checkAdminExist(emailStr);
      if (!userExists) {
        return Err(new Error('User does not exist or is not an admin'));
      }

    try {
      const currentEvent = await this.eventRepository.findOneById(eventId);
      if (!currentEvent) {
        return Err(new Error('Event not found'));
      }
      if (dto.isApproved !== undefined && dto.isApproved !== currentEvent.isApproved && emailStr !== currentEvent.manageBy) {
        return Err(new Error('You do not have permission to approve or unapprove this event'));
      }
      const event = await this.eventRepository.updateEventFields(dto, eventId);

      if (!event) {
        return Err(new Error('Failed to update event'));
      }

      if (dto.categoryIds?.length) {
        await this.updateEventRepository.updateEventCategories(
          event.id,
          dto.categoryIds,
          dto.isSpecialForCategory,
        );
      }

      const categories = await this.updateEventRepository.getEventCategories(event.id);

      const eventDto: EventDto = {
        id: event.id,
        title: event.title,
        description: event.description,
        locationId: event.locationId,
        organizerId: event.organizerId,
        venue: event.venue,
        imgLogoId: event.imgLogoId,
        imgPosterId: event.imgPosterId,
        createdAt: event.createdAt,
        isOnlyOnEve: event.isOnlyOnEve,
        isSpecial: event.isSpecial,
        isSpecialForCategory: dto.isSpecialForCategory,
        lastScore: event.lastScore.toNumber(),
        totalClicks: event.totalClicks,
        weekClicks: event.weekClicks,
        isApproved: event.isApproved,
        orgName: event.orgName,
        orgDescription: event.orgDescription,
        isOnline: event.isOnline,
        categories,
      };

      if (dto.isApproved) {
        const createEventDto: CreateEventDto = {
          title: eventDto.title,
          description: eventDto.description,
          venue: eventDto.venue,
          orgName: eventDto.orgName,
          orgDescription: eventDto.orgDescription,
          isOnline: eventDto.isOnline,
          imgLogoUrl: "",
          imgPosterUrl: "",
          categoryIds: eventDto.categories.map(category => category.id),
        };

        this.newEventTriggerService.sendEmailToUsers(createEventDto, eventDto.organizerId, eventId);
      }

      
      return Ok(eventDto);
    } catch (error) {
      console.error(error);
       await this.slackService.sendError(` Event Svc - Admin >>> UpdateEventAdmin: ${error}`);
       return Err(new Error('Failed to update event'));
    }
  }
}
