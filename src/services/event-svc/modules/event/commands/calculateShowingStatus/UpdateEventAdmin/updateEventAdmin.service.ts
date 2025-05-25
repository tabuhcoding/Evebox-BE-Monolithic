import { Inject, Injectable } from '@nestjs/common';
import { Result, Ok, Err } from 'oxide.ts';
import { UpdateEventAdminDto } from './updateEventAdmin.dto';
import { EventDto } from './updateEventAdmin-response.dto';
import { Email } from 'src/services/auth-svc/modules/user/domain/value-objects/user/email.vo';
import { UserRepositoryImpl } from 'src/services/auth-svc/repository/users/user.repository.impl';
import { EventsRepository } from 'src/services/event-svc/repository/events/events.repo';
import { EventCategoriesRepository } from 'src/services/event-svc/repository/eventCategories/eventCategories.repo';
import { SlackService } from 'src/infrastructure/adapters/slack/slack.service';

@Injectable()
export class UpdateEventAdminService {
  constructor(
    @Inject('EventCategoriesRepository') private readonly updateEventRepository: EventCategoriesRepository,
    @Inject('EventsRepository') private readonly eventRepository: EventsRepository,
    private readonly userRepository: UserRepositoryImpl,
    private readonly slackService: SlackService,
    
  ) {}

  async execute(dto: UpdateEventAdminDto, eventId: number, emailStr: string): Promise<Result<EventDto, Error>> {
    const emailOrError = Email.create(emailStr);
    if (emailOrError.isErr()) {
      return Err(new Error('Invalid email'));
    }

    const email = emailOrError.unwrap();
    const user = await this.userRepository.findByEmail(email);
    if (!user || user.role.getValue() !== 1) {
      return Err(new Error('You do not have permission to update event'));
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
       this.slackService.sendError(` Event Svc - Admin >>> UpdateEventAdmin: ${error}`);
       return Err(new Error('Failed to update event'));
    }
  }
}
