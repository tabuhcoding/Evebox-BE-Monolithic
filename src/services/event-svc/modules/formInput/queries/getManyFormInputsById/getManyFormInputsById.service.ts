import { Inject, Injectable } from "@nestjs/common";
import { Result, Ok, Err } from "oxide.ts";
import { FormInput } from "@prisma/client";

import { FormInputRepository } from "src/services/event-svc/repository/formInput/formInput.repo";
import { SlackService } from "src/infrastructure/adapters/slack/slack.service";

@Injectable()
export class GetManyFormInputsByIdService {
  constructor(
    @Inject('FormInputRepository') private readonly formInputRepository: FormInputRepository,
    private readonly slackService: SlackService,
  ) {}

  async execute (formId: number): Promise<Result<FormInput[], Error>> {
    try {
      const formInputs = await this.formInputRepository.findMany({
        formId
      });

      return Ok(formInputs);
    } catch (error) {
      console.error("🚀 ~ GetManyFormInputsByIdService ~ execute ~ error:", error);
      this.slackService.sendError(`Event Svc >>> GetManyFormInputsByIdService : ${error.message}`);

      return Err(new Error('Failed to retrieve many form inputs by id'));
    }
  }
}