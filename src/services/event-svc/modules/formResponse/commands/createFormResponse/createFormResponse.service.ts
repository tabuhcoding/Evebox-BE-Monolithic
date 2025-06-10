import { Inject, Injectable } from "@nestjs/common";
import { Result, Ok, Err } from "oxide.ts";

import { CreateFormResponseDto } from "./createFormResponse.dto";
import { FormResponseRepository } from "src/services/event-svc/repository/formResponse/formResponse.repo";
import { SlackService } from "src/infrastructure/adapters/slack/slack.service";

@Injectable()
export class CreateFormResponseService {
  constructor(
    @Inject('FormResponseRepository') private readonly formResponseRepository: FormResponseRepository,
    private readonly slackService: SlackService,
  ) {}

  async execute(dto: CreateFormResponseDto, userId: string): Promise<Result<any, Error>> {
    try {
      const formResponse = await this.formResponseRepository.createFormResponse(dto, userId);

      if (!formResponse) {
        return Err(new Error('Failed to create form response'));
      }

      return Ok(formResponse);
    } catch (error) {
      this.slackService.sendError(`Event Service - Create form response >>> UpdateFormResponseService: ${error.message}`)

      return Err(new Error(`Failed to create form response: ${error.message}`));
    }
  }
}