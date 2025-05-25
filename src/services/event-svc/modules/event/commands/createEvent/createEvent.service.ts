import { Inject, Injectable } from "@nestjs/common";
import { Result, Ok, Err } from "oxide.ts";
import { EventsRepository } from "src/services/event-svc/repository/events/events.repo";
import { CreateEventDto } from "./createEvent.dto";
import { CreateEventResponseData } from "./createEvent-response.dto";

@Injectable()
export class CreateEventService {
  constructor(
    @Inject('EventsRepository') private readonly eventsRepository: EventsRepository,
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
        const locationIdRes = await this.eventsRepository.createLocation(dto.streetString, dto.wardString, dto.districtId);
        if (!locationIdRes) {
          return Err(new Error('Failed to create location'));
        }
        locationId = locationIdRes;
      }
      const eventId = await this.eventsRepository.createEvent(dto, email, locationId);
      if (!eventId) {
        return Err(new Error('Failed to create event'));
      }

      const categoryResult = await this.eventsRepository.createEventCategory(eventId, categories);
      if (categoryResult.isErr()) {
        return Err(categoryResult.unwrapErr());
      }

      return Ok({ id: eventId });
    } catch (error) {
      return Err(new Error(`Error creating event: ${error.message}`));
    }
  }
}