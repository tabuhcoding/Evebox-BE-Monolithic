import { Inject, Injectable } from "@nestjs/common";
import { Result, Ok, Err } from "oxide.ts";

import { EventsRepository } from "src/services/event-svc/repository/events/events.repo";
import { EventCategoriesRepository } from "src/services/event-svc/repository/eventCategories/eventCategories.repo";
import { EVENT_ROLE } from "../../domain/eventRole";
import { LocationsRepository } from "src/services/event-svc/repository/locations/location.repo";
import { UpdateEventDto } from "./updateEvent.dto";
import { UpdateEventResponseData } from "./updateEvent-response.dto";
import { SlackService } from "src/infrastructure/adapters/slack/slack.service";
import { CheckUserExistService } from "src/services/auth-svc/modules/user/commands/checkuserExist/checkuserExist.service";

@Injectable()
export class UpdateEventService {
  constructor(
    @Inject('EventsRepository') private readonly eventsRepository: EventsRepository,
    @Inject('EventCategoriesRepository') private readonly eventCategoriesRepository: EventCategoriesRepository,
    @Inject('LocationsRepository') private readonly locationsRepository: LocationsRepository,
    private readonly slackService: SlackService,
    private readonly checkUserExistService: CheckUserExistService, 
  ) {}

  async execute(dto: UpdateEventDto, email: string, id: number): Promise<Result<UpdateEventResponseData, Error>> {
    try {
      // Check if the user exists
      const userExists = await this.checkUserExistService.execute(email);
      if (!userExists) {
        return Err(new Error('User does not exist'));
      }

      const hasPermisison = await this.eventsRepository.hasPermissionToManageEvent(id, email, EVENT_ROLE.IS_EDITED);
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

      const [eventId, isApproved] = await this.eventsRepository.updateEvent(dto, id, locationId);
      if (!eventId) {
        return Err(new Error('Failed to update event'));
      }

      if (isApproved) {
        this.slackService.sendNotice(`Event Service - Event >>> Event with ID ${eventId} has been updated.`);
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