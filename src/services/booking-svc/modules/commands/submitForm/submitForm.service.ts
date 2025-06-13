import { Injectable } from "@nestjs/common";
import { Result, Ok, Err } from "oxide.ts";

import { SubmitFormDto } from "./submitForm.dto";
import { SubmitFormResponseData, FormAnswerResponseDto } from "./submitForm-response.dto";
import { SlackService } from "src/infrastructure/adapters/slack/slack.service";
import { SubmitFormResponseService } from "src/services/event-svc/modules/formResponse/commands/submitForm/submitForm.service";

@Injectable()
export class SubmitFormService {
  constructor(
    private readonly slackService: SlackService,
    private readonly submitFormService: SubmitFormResponseService,
  ) {}

  async execute (dto: SubmitFormDto, userId: string): Promise<Result<SubmitFormResponseData, Error>> {
    try {
      const formResponse = await this.submitFormService.submitForm(dto, userId);
      if (formResponse instanceof Error) {
        await this.slackService.sendError(`Booking Svc >>> SubmitFormService : ${formResponse.message}`);
        return Err(formResponse);
      }
      const formResponseFormatted: SubmitFormResponseData = {
        formResponseId: formResponse.id,
        answers: formResponse.FormAnswer.map((answer: any) => ({
          id: answer.id,
          formInputId: answer.formInputId,
          value: answer.value,
        })),
      };
      return Ok(formResponseFormatted)

      // const formResponseFormatted = {
      //   formResponseId: formResponse.id,
      //   answers: formResponse.FormAnswer.map((answer: FormAnswerResponseDto) => ({
      //     id: answer.id,
      //     formInputId: answer.formInputId,
      //     value: answer.value,
      //   })),
      // };

      // return Ok(formResponseFormatted);
    } catch (error) {
      await this.slackService.sendError(`Booking Svc >>> SubmitFormService : ${error.message}`);

      return Err(new Error('Failed to retrieve form by id'));
    }
  }
}