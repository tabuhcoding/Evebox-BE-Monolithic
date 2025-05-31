import { Inject, Injectable } from "@nestjs/common";
import { Err, Ok, Result } from "oxide.ts";
import { EventDataDto } from "./getEvents-response.dto";
import { EventCategoriesRepository } from "src/services/event-svc/repository/eventCategories/eventCategories.repo";
import { SlackService } from "src/infrastructure/adapters/slack/slack.service";
import { EventsRepository } from "src/services/event-svc/repository/events/events.repo";
import { CheckUserExistService } from "src/services/auth-svc/modules/user/commands/checkuserExist/checkuserExist.service";

@Injectable()
export class GetEventsByAdminService {
  constructor(
    private readonly checkUserExistService: CheckUserExistService,  
    @Inject('EventsRepository') private readonly eventRepository: EventsRepository,
    private readonly slackService: SlackService,    
    @Inject('EventCategoriesRepository') private readonly eventCategoriesRepository: EventCategoriesRepository,
  ) {}

  async execute(filters: any, email: string): Promise<Result<EventDataDto[], Error>> {
    const userExists = await this.checkUserExistService.execute(email);
      if (!userExists) {
        return Err(new Error('User does not exist'));
      }

    const result = await this.eventRepository.findWithFilters(filters);
    if (result.isErr()) {
       return Err(result.unwrapErr());
    }
    const data = result.unwrap();

    const enrichedEvents: EventDataDto[] = [];

    for (const event of data) {
      const categories = await this.eventCategoriesRepository.getCategoriesByEventId(event.id);
      const showings = await this.eventRepository.getShowingsByEventId(event.id);
      const startTime = await this.calculateStartDate(showings);

      const location = event.locations;
      const locationString = `${location?.street ?? ''}, ${location?.ward ?? ''}, ${location?.districts?.name ?? ''}, ${location?.districts?.province?.name ?? ''}`;

      enrichedEvents.push({
        ...event,
        startDate: startTime,
        locationString,
        categories,
      });
    }

    return Ok(enrichedEvents);
  }

  async count(filters: any): Promise<number> {
    return this.eventRepository.count(filters);
  }

  private async calculateStartDate(showings: { startTime: Date }[]): Promise<Date> {
    if (!showings.length) return null;
    return showings.reduce((earliest, current) =>
      current.startTime < earliest ? current.startTime : earliest, showings[0].startTime
    );
  }
}
