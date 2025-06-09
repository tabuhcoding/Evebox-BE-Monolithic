import { Inject, Injectable } from "@nestjs/common";
import { Result, Ok, Err } from "oxide.ts";

import { EventsRepository } from "src/services/event-svc/repository/events/events.repo";

@Injectable()
export class CheckUserPermissionService {
  constructor(
    @Inject('EventsRepository') private readonly eventsRepository: EventsRepository,
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
}