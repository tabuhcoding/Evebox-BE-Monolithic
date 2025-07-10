import { NewEventTriggerService } from 'src/services/auth-svc/modules/notice/trigger/newEvent/newEventTrigger.service';
import { GetPreviewShowingService } from 'src/services/event-svc/modules/showing/queries/getPreviewShowing/getPreviewShowing.service';
import { Inject, Injectable } from "@nestjs/common";
import { Result, Ok, Err } from "oxide.ts";

import { ShowingRepository } from "src/services/event-svc/repository/showing/showing.repo";
import { EventsRepository } from "src/services/event-svc/repository/events/events.repo";
import { CreateShowingDto } from "./createShowing.dto";
import { SlackService } from "src/infrastructure/adapters/slack/slack.service";
import { CheckUserExistService } from "src/services/auth-svc/modules/user/commands/checkuserExist/checkuserExist.service";

@Injectable()
export class CreateShowingService {
  constructor(
    @Inject('EventsRepository') private readonly eventsRepository: EventsRepository,
    @Inject('ShowingRepository') private readonly showingRepository: ShowingRepository,
    private readonly slackService: SlackService,
    private readonly checkUserExistService: CheckUserExistService,
    private readonly getPreviewShowingService: GetPreviewShowingService,
    private readonly newEventTriggerService: NewEventTriggerService
  ) {}

  async execute(dto: CreateShowingDto, eventId: number, userEmail: string): Promise<Result<string, Error>> {
    try {
      const userExists = await this.checkUserExistService.execute(userEmail);
      if (!userExists) {
        return Err(new Error('User does not exist'));
      }
      
      const event = await this.eventsRepository.findOneById(eventId);

      if (!event) {
        return Err(new Error('Event not found'));
      }

      if(!dto.startTime || !dto.endTime || dto.startTime >= dto.endTime) {
        return Err(new Error('Invalid start time or end time'));
      }

      const result = await this.showingRepository.createShowing(dto, eventId);

      if (!result) {
        return Err(new Error(result.unwrapErr().message));
      }

      const [showingId, isApproved] = result.unwrap();
      if (isApproved) {
        const previewShowing = await this.getPreviewShowingService.execute(showingId);
        if (previewShowing){
          this.newEventTriggerService.sendNewShowingToUsers(previewShowing, eventId);
        }
        this.slackService.sendNotice(`Event Service - Showing >>> CreateShowingService: Event with ID ${eventId} has been created showing.`);
      }

      return Ok(showingId);
    } catch (error) {
      await this.slackService.sendError(`EventSvc - Showing >>> CreateShowingService: ${error.message}`);

      return Err(new Error(`Failed to create showing: ${error.message}`));
    }
  }
}