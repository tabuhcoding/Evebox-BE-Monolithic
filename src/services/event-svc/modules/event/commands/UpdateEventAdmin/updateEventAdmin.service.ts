import { Inject, Injectable } from '@nestjs/common';
import { Result, Ok, Err } from 'oxide.ts';
import { UpdateEventAdminDto } from './updateEventAdmin.dto';
import { EventDto } from './updateEventAdmin-response.dto';
import { EVENT_ROLE } from '../../domain/eventRole';
import { EventsRepository } from 'src/services/event-svc/repository/events/events.repo';
import { EventCategoriesRepository } from 'src/services/event-svc/repository/eventCategories/eventCategories.repo';
import { SlackService } from 'src/infrastructure/adapters/slack/slack.service';
import { CheckUserExistService } from 'src/services/auth-svc/modules/user/commands/checkuserExist/checkuserExist.service';

@Injectable()
export class UpdateEventAdminService {
  constructor(
    @Inject('EventCategoriesRepository') private readonly updateEventRepository: EventCategoriesRepository,
    @Inject('EventsRepository') private readonly eventRepository: EventsRepository,
    private readonly slackService: SlackService,
    private readonly checkUserExistService: CheckUserExistService,  
  ) {}

  async execute(dto: UpdateEventAdminDto, eventId: number, emailStr: string): Promise<Result<EventDto, Error>> {
    const userExists = await this.checkUserExistService.execute(emailStr);
      if (!userExists) {
        return Err(new Error('User does not exist'));
      }

      const hasPermisison = await this.eventRepository.hasPermissionToManageEvent(eventId, emailStr, EVENT_ROLE.IS_EDITED);
      if (hasPermisison.isErr()) {
        return Err(new Error('Failed to check permission'));
      }

      if (!hasPermisison.unwrap()) {
        return Err(new Error('Unauthorized'));
      }


    try {
      console.log(eventId);
      const event = await this.eventRepository.updateEventFields(dto, eventId);
      console.log(event);

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
      console.log(eventDto);

      return Ok(eventDto);
    } catch (error) {
      console.error(error);
       await this.slackService.sendError(` Event Svc - Admin >>> UpdateEventAdmin: ${error}`);
       return Err(new Error('Failed to update event'));
    }
  }
}
