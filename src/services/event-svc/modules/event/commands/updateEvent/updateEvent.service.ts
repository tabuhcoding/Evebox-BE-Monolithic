import { Inject, Injectable } from "@nestjs/common";
import { Result, Ok, Err } from "oxide.ts";

import { EventsRepository } from "src/services/event-svc/repository/events/events.repo";
import { EventCategoriesRepository } from "src/services/event-svc/repository/eventCategories/eventCategories.repo";
import { LocationsRepository } from "src/services/event-svc/repository/locations/location.repo";
import { UpdateEventDto } from "./updateEvent.dto";
import { UpdateEventResponseData } from "./updateEvent-response.dto";
import { SlackService } from "src/infrastructure/adapters/slack/slack.service";

@Injectable()
export class UpdateEventService {
  constructor(
    @Inject('EventsRepository') private readonly eventsRepository: EventsRepository,
    @Inject('EventCategoriesRepository') private readonly eventCategoriesRepository: EventCategoriesRepository,
    @Inject('LocationsRepository') private readonly locationsRepository: LocationsRepository,
    private readonly slackService: SlackService
  ) {}

  async execute(dto: UpdateEventDto, email: string, id: number): Promise<Result<UpdateEventResponseData, Error>> {
    try {
      const hasPermisison = await this.eventsRepository.hasPermissionToUpdateEvent(id, email);
      if (hasPermisison.isErr()) {
        return Err(new Error('Failed to check permission'));
      }

      if (!hasPermisison.unwrap()) {
        return Err(new Error('Unauthorized'));
      }

      let locationId: number | undefined;
      if (dto.streetString && dto.wardString && dto.districtId) {
        const locationIdRes = await this.locationsRepository.createLocation(dto.streetString, dto.wardString, dto.districtId);
        if (!locationIdRes) {
          return Err(new Error('Failed to create location'));
        }
        locationId = locationIdRes;
      }

      const eventId = await this.eventsRepository.updateEvent(dto, id, email, locationId);
      if (!eventId) {
        return Err(new Error('Failed to update event'));
      }

      if (dto.categoryIds && dto.categoryIds.length > 0) {
        const categoryResult = await this.eventCategoriesRepository.updateEventCategory(id, dto.categoryIds);
        if (categoryResult.isErr()) {
          return Err(new Error('Failed to update event categories'));
        }
      }

      return Ok({ id: eventId });
    } catch (error) {
      this.slackService.sendError(`EventSvc - Event >>> UpdateEventService: ${error.message}`);
      return Err(new Error(`Error updating event: ${error.message}`));
    }
  }
}