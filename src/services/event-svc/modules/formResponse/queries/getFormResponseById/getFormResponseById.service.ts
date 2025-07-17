import { Inject, Injectable } from "@nestjs/common";
import { Result, Ok, Err } from "oxide.ts";

import { FormResponse, FormResponseRepository } from "src/services/event-svc/repository/formResponse/formResponse.repo";
import { SlackService } from "src/infrastructure/adapters/slack/slack.service";

@Injectable()
export class GetFormResponseByIdService {
  constructor(
    @Inject('FormResponseRepository') private readonly formResponseRepository: FormResponseRepository,
    private readonly slackService: SlackService,
  ) {}

  async execute(id: number): Promise<Result<any, Error>> {
    try {
      const formResponse = await this.formResponseRepository.getFormResponseById(id);
      
      if (!formResponse) {
        return Err(new Error('Form response not found'));
      }

      return Ok(formResponse);
    } catch (error) {
      console.error("🚀 ~ GetFormResponseByIdService ~ execute ~ error:", error);
      await this.slackService.sendError(`Event Svc >>> GetFormResponseByIdService : ${error.message}`);

      return Err(new Error('Failed to retrieve form response'));
    }
  }

  async executeMany(ids: number[]): Promise<Result<Map<number,FormResponse>, Error>> {
    try {
      const formResponses = await this.formResponseRepository.findMany({
        id: { in: ids }
      }, {
        FormAnswer: {
          include: {
            FormInput: true,
          }
        }
      })
      // Filter out null responses
      const formResponseMap = new Map<number, FormResponse>();
      formResponses.forEach(formResponse => {
        if (formResponse) {
          formResponseMap.set(formResponse.orderId, formResponse);
        }
      });
      return Ok(formResponseMap);
    } catch (error) {
      console.error("🚀 ~ GetFormResponseByIdService ~ executeMany ~ error:", error);
      await this.slackService.sendError(`Event Svc >>> GetFormResponseByIdService : ${error.message}`);

      return Err(new Error('Failed to retrieve form responses'));
    }
  }
}