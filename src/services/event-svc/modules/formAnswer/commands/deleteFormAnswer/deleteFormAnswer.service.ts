import { Inject, Injectable } from "@nestjs/common";
import { Result, Ok, Err } from "oxide.ts";

import { FormAnswerRepository } from "src/services/event-svc/repository/formAnswer/formAnswer.repo";
import { SlackService } from "src/infrastructure/adapters/slack/slack.service";

@Injectable()
export class DeleteFormAnswerService {
  constructor(
    @Inject('FormAnswerRepository') private readonly formAnswerReposiotory: FormAnswerRepository,
    private readonly slackService: SlackService,
  ) {}

  async execute(formResponseId: number): Promise<Result<void, Error>> {
    try {
      await this.formAnswerReposiotory.deleteHardMany({
        formResponseId
      });

      return Ok(null);
    } catch (error) {
      this.slackService.sendError(`Event Service - Delete form answer >>> DeleteFormAnswerService: ${error.message}`)

      return Err(new Error('Failed to delete form response'));
    }
  }
}