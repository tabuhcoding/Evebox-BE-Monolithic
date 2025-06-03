import { Inject, Injectable } from "@nestjs/common";
import { Result, Ok, Err } from "oxide.ts";

import { FormRepository } from "src/services/event-svc/repository/form/form.repo";
import { ShowingRepository } from "src/services/event-svc/repository/showing/showing.repo";
import { ConnectFormDto } from "./connectFormToShowing.dto";
import { ConnectFormResponseData } from "./connectFormToShowing-response.dto";
import { CheckUserExistService } from "src/services/auth-svc/modules/user/commands/checkuserExist/checkuserExist.service";
import { SlackService } from "src/infrastructure/adapters/slack/slack.service";

@Injectable()
export class ConnectFormService {
  constructor(
    @Inject('FormRepository') private readonly formRepository: FormRepository,
    @Inject('ShowingRepository') private readonly showingRepository: ShowingRepository,
    private readonly slackService: SlackService,
    private readonly checkUserExistService: CheckUserExistService,
  ) { }

  async execute(dto: ConnectFormDto, userEmail: string): Promise<Result<ConnectFormResponseData, Error>> {
    try {
      const showing = await this.showingRepository.findOneById(dto.showingId);
      if (!showing) {
        return Err(new Error('Showing not found'));
      }

      const form = await this.formRepository.findOneById(Number(dto.formId));
      if (!form) {
        return Err(new Error('Form not found'));
      }

      const userExists = await this.checkUserExistService.execute(userEmail);
      if (!userExists) {
        return Err(new Error('User does not exist'));
      }

      const isAuthor = await this.showingRepository.checkAuthor(dto.showingId, userEmail);
      if (isAuthor.isErr()) {
        return Err(new Error(isAuthor.unwrapErr().message));
      }
      if (!isAuthor.unwrap()) {
        return Err(new Error('You do not have permission to update showing'));
      }

      const result = await this.formRepository.connectForm(dto);
      if (result.isErr()) {
        return Err(new Error(result.unwrapErr().message));
      }

      const [{ showingId, formId }, isApproved] = result.unwrap();
      if (isApproved) {
        this.slackService.sendNotice(`Event Service - Form >>> ConnectFormService: Event with ID ${showing.eventId} has been connected form ${dto.formId} to showing ${dto.showingId}`);
      }

      return Ok({ showingId, formId });
    } catch (error) {
      this.slackService.sendError(`Event Service - Showing >>> ConnectFormService: ${error.message}`);
      return Err(new Error(`Error connect form to showing: ${error.message}`));
    }
  }
}