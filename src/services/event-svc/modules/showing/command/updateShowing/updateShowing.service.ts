import { Inject, Injectable } from "@nestjs/common";
import { Result, Ok, Err } from "oxide.ts";

import { ShowingRepository } from "src/services/event-svc/repository/showing/showing.repo";
import { UpdateShowingDto } from "./updateShowing.dto";
import { CheckUserExistService } from "src/services/auth-svc/modules/user/commands/checkuserExist/checkuserExist.service";
import { SlackService } from "src/infrastructure/adapters/slack/slack.service";

@Injectable()
export class UpdateShowingService {
  constructor(
    @Inject('ShowingRepository') private readonly showingRepository: ShowingRepository,
    private readonly slackService: SlackService,
    private readonly checkUserExistService: CheckUserExistService, 
  ) {}

  async execute(dto: UpdateShowingDto, id: string, userEmail: string): Promise<Result<string, Error>> {
    try {
      const showing = await this.showingRepository.findOneById(id);
      if (!showing) {
        return Err(new Error('Showing not found'));
      }

      const userExists = await this.checkUserExistService.execute(userEmail);
      if (!userExists) {
        return Err(new Error('User does not exist'));
      }

      const isAuthor = await this.showingRepository.checkAuthor(id, userEmail);
      if (isAuthor.isErr()) {
        return Err(new Error('Failed to check author'));
      }

      if (!isAuthor.unwrap()) {
        return Err(new Error('You do not have permission to update showing'));
      }

      const result = await this.showingRepository.updateShowing(dto, id);
      if (result.isErr()) {
        return Err(new Error(result.unwrapErr().message));
      }

      const [showingId, isApproved] = result.unwrap();
      if (isApproved) {
        this.slackService.sendNotice(`Event Service - Showing >>> UpdateShowingService: Event with ID ${showing.eventId} has been updated.`);
      }

      return Ok(showingId);
    } catch (error) {
      this.slackService.sendError(`Event Service - Showing >>> UpdateShowingService: ${error.message}`);
      return Err(new Error(`Error updating showwing: ${error.message}`));
    }
  }
}