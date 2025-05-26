import { Inject, Injectable } from "@nestjs/common";
import { Result, Ok, Err } from "oxide.ts";

import { EventsRepository } from "src/services/event-svc/repository/events/events.repo";
import { EventCategoriesRepository } from "src/services/event-svc/repository/eventCategories/eventCategories.repo";
import { LocationsRepository } from "src/services/event-svc/repository/locations/location.repo";
import { CreateEventDto } from "./createEvent.dto";
import { CreateEventResponseData } from "./createEvent-response.dto";
import { SlackService } from "src/infrastructure/adapters/slack/slack.service";

@Injectable()
export class CreateEventService {
  constructor(
    @Inject('EventsRepository') private readonly eventsRepository: EventsRepository,
    @Inject('EventCategoriesRepository') private readonly eventCategoriesRepository: EventCategoriesRepository,
    @Inject('LocationsRepository') private readonly locationsRepository: LocationsRepository,
    private readonly slackService: SlackService
  ) {}

  async execute(dto: CreateEventDto, email: string): Promise<Result<CreateEventResponseData, Error>> {
    try {
      const categories = dto.categoryIds;
      if (categories.length === 0) {
        return Err(new Error('Categories not found'));
      }
      if (!dto.title || !dto.description || !dto.orgName || !dto.orgDescription) {
        return Err(new Error('Required fields are missing'));
      }
      if (dto.isOnline === undefined) {
        return Err(new Error('isOnline field is required'));
      }

      let locationId: number | undefined;
      if (!dto.isOnline) {
        if (!dto.streetString || !dto.wardString || !dto.districtId) {
          return Err(new Error('Location information is required'));
        }
        const locationIdRes = await this.locationsRepository.createLocation(dto.streetString, dto.wardString, dto.districtId);
        if (!locationIdRes) {
          return Err(new Error('Failed to create location'));
        }
        locationId = locationIdRes;
      }
      const eventId = await this.eventsRepository.createEvent(dto, email, locationId);
      if (!eventId) {
        return Err(new Error('Failed to create event'));
      }

      const categoryResult = await this.eventCategoriesRepository.createEventCategory(eventId, categories);
      if (categoryResult.isErr()) {
        return Err(categoryResult.unwrapErr());
      }

      return Ok({ id: eventId });
    } catch (error) {
      this.slackService.sendError(`EventSvc - Event >>> CreateEventService: ${error.message}`);
      return Err(new Error(`Error creating event: ${error.message}`));
    }
  }
}