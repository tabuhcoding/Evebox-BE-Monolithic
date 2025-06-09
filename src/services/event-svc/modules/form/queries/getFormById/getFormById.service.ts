import { Inject, Injectable } from "@nestjs/common";
import { Result, Ok, Err } from "oxide.ts";
import { Form } from "@prisma/client";

import { FormRepository } from "src/services/event-svc/repository/form/form.repo";
import { SlackService } from "src/infrastructure/adapters/slack/slack.service";

@Injectable()
export class GetFormByIdService {
  constructor(
    @Inject('FormRepository') private readonly formRepository: FormRepository,
    private readonly slackService: SlackService,
  ) { }

  async execute(formId: number): Promise<Result<Form, Error>> {
    try {
      const form = await this.formRepository.findOneById(Number(formId));

      if (!form) {
        return Ok(null);
      }

      return Ok(form);
    } catch (error) {
      console.error("🚀 ~ GetFormbyIdService ~ execute ~ error:", error);
      this.slackService.sendError(`Event Svc >>> GetFormbyIdService : ${error.message}`);

      return Err(new Error('Failed to retrieve form by id'));
    }
  }
}