import { Inject, Injectable } from "@nestjs/common";
import { Result, Ok, Err } from "oxide.ts";

import { EventsRepository } from "src/services/event-svc/repository/events/events.repo";
import { ShowingRepository } from "src/services/event-svc/repository/showing/showing.repo";

@Injectable()
export class CheckUserPermissionService {
  constructor(
    @Inject('EventsRepository') private readonly eventsRepository: EventsRepository,
    @Inject('ShowingRepository') private readonly showingRepository: ShowingRepository,
  ) {}

  async execute(eventId: number, userEmail: string, permission: string, action: string): Promise<Result<boolean, Error>> {
    try {
      const hasPermission = await this.eventsRepository.hasPermissionToManageEvent(eventId, userEmail, permission);
      if (hasPermission.isErr()) {
        return Err(new Error(hasPermission.unwrapErr().message));
      }

      if (!hasPermission.unwrap()) {
        return Err(new Error(`You do not have permission to ${action}`));
      }

      return Ok(true);
    } catch (error) {
      return Err(new Error('Failed to check user permission'));
    }
  }

  async hasPermissionToManageShowing(showingId: string, userEmail: string, permission: string): Promise<Result<boolean, Error>> {
    try {
      const showing = await this.showingRepository.findOneById(showingId);
      if (!showing) {
        return Err(new Error('Showing not found'));
      }

      const hasPermission = await this.eventsRepository.hasPermissionToManageEvent(showing.eventId, userEmail, permission);
      if (hasPermission.isErr()) {
        return Err(new Error(hasPermission.unwrapErr().message));
      }

      return Ok(hasPermission.unwrap());
    } catch (error) {
      return Err(new Error('Failed to check permission for showing'));
    }
  }
}