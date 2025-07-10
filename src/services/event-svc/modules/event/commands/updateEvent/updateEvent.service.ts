import { districts } from './../../../../../../../prisma/client-event/index.d';
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
import { DistrictsRepository } from 'src/services/event-svc/repository/districts/districts.repo';
import { CheckUpdateEventService } from 'src/services/rag-svc/modules/openai/api/checkUpdateEvent/checkUpdateEvent.service';
import { FileCacheService } from 'src/infrastructure/cache/fileCache/fileCache.service';
import Hashids from 'hashids';

@Injectable()
export class UpdateEventService {
  private hashids: Hashids;
  constructor(
    @Inject('EventsRepository') private readonly eventsRepository: EventsRepository,
    @Inject('EventCategoriesRepository') private readonly eventCategoriesRepository: EventCategoriesRepository,
    @Inject('LocationsRepository') private readonly locationsRepository: LocationsRepository,
    private readonly slackService: SlackService,
    private readonly checkUserExistService: CheckUserExistService, 
    @Inject('DistrictsRepository') private readonly districtsRepository: DistrictsRepository,
    private readonly checkUpdateEventService: CheckUpdateEventService,
    private readonly fileCache: FileCacheService
  ) {
    this.hashids = new Hashids('evebox-salt', 12);
  }

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

      const event = await this.eventsRepository.findOneById(id)

      var isValid = event.isApproved;

      if (!dto.signMessage && isValid) {
        const langGraphCheck = await this.langGraphCheck(dto, id);
        if (!langGraphCheck) {
          return Err(new Error('Failed to check the event update'));
        }

        if (!langGraphCheck[0]) {
          // Generate a sign message from date.now and email and eventid
          const signMessage = this.hashids.encode(Date.now()+id);
          await this.fileCache.cacheObject("update-event",
            20,
            {},
            signMessage,
            [dto]
          )
          return Ok({
            id: id,
            isApproved: false,
            signMessage: signMessage,
            checkMessage: langGraphCheck[1],
          });
        }
      } else if (dto.signMessage && isValid) {
        const cachedData = await this.fileCache.getCacheObjectById("update-event", {}, dto.signMessage);
        if (!cachedData){
          return Err(new Error('Invalid sign message'));
        }
        dto = cachedData.data[0];
        isValid = false
      }
      let locationId: number | undefined;
      if (dto.streetString && dto.wardString && dto.districtId) {
        const locationIdRes = await this.locationsRepository.createLocation(dto.streetString, dto.wardString, dto.districtId);
        if (!locationIdRes) {
          return Err(new Error('Failed to create location'));
        }
        locationId = locationIdRes;
      }

      const [eventId, isApproved] = await this.eventsRepository.updateEvent(dto, id, isValid, locationId);
      if (!eventId) {
        return Err(new Error('Failed to update event'));
      }

      if (isApproved) {
        await this.slackService.sendNotice(`Event Service - Event >>> Event with ID ${eventId} has been updated.`);
      }

      if (dto.categoryIds && dto.categoryIds.length > 0) {
        const categoryResult = await this.eventCategoriesRepository.updateEventCategory(id, dto.categoryIds);
        if (categoryResult.isErr()) {
          return Err(new Error('Failed to update event categories'));
        }
      }

      return Ok({ id: eventId, isApproved: true });
    } catch (error) {
      await this.slackService.sendError(`EventSvc - Event >>> UpdateEventService: ${error.message}`);
      return Err(new Error(`Error updating event: ${error.message}`));
    }
  }

  async langGraphCheck(dto: UpdateEventDto, id: number): Promise<[boolean, string] | undefined> {
    try {
      const event = await this.eventsRepository.findOneById(id,{
        locations: {
          include: {
            districts: {
              include: {
                province: true,
              },
            },
          },
        }
      });
      var isValid = true;
      var message = '';

      if(dto.districtId)
      {
        const district = await this.districtsRepository.findOneById(dto.districtId, {
          include: {
            province: true,
          },
        });
        if (!district) {
          isValid = false;
          message += 'District not found';
        }
        if (district.province.id !== event.locations.districts.province.id) {
          isValid = false;
          message += 'You change the event to another province';
        }
      }

      if (dto.title || dto.description) {
        const checkUpdateResult = await this.checkUpdateEventService.checkUpdateEvent(
          dto.title || event.title,
          dto.description || event.description,
          event.title,
          event.description
        );

        if (!checkUpdateResult) {
          return undefined;
        } else if (!checkUpdateResult.isApproved) {
          isValid = false;
          message += checkUpdateResult.message;
        }
      }
      return [isValid, message];
    } catch (error) {
      await this.slackService.sendError(`EventSvc - Event >>> UpdateEventService.langGraphCheck: ${error.message}`);
      return undefined;
    }
  }
}