import { Inject, Injectable } from "@nestjs/common";
import { Result, Ok, Err } from "oxide.ts";
import { FormResponse } from "prisma/client-event";

import { FormResponseRepository } from "src/services/event-svc/repository/formResponse/formResponse.repo";
import { SlackService } from "src/infrastructure/adapters/slack/slack.service";

@Injectable()
export class GetFormResponseService {
  constructor(
    @Inject('FormResponseRepository') private readonly formResponseRepository: FormResponseRepository,
    private readonly slackService: SlackService,
  ) { }

  async execute(userId: string, formId: number, showingId: string): Promise<Result<FormResponse, Error>> {
    try {
      const formResponse = await this.formResponseRepository.findOne(
        {
          userId: userId,
          formId,
          showingId,
          Ticket: {
            none: {}, // Không có ticket nào liên kết với FormResponse này
          },
        },
        {
          FormAnswer: true,
        }
      );

      if (!formResponse) {
        return Ok(null);
      }

      return Ok(formResponse);
    } catch (error) {
      console.error("🚀 ~ GetFormResponseByIdService ~ execute ~ error:", error);
      await this.slackService.sendError(`Event Svc >>> GetFormResponseByIdService : ${error.message}`);

      return Err(new Error('Failed to retrieve form response'));
    }
  }
}