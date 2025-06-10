import { Injectable } from "@nestjs/common";
import { Result, Ok, Err } from "oxide.ts";

import { SubmitFormDto } from "./submitForm.dto";
import { SubmitFormResponseData, FormAnswerResponseDto } from "./submitForm-response.dto";
import { SlackService } from "src/infrastructure/adapters/slack/slack.service";

@Injectable()
export class SubmitFormService {
  constructor(
    private readonly slackService: SlackService
  ) {}

  async execute (dto: SubmitFormDto, userId: string): Promise<Result<SubmitFormResponseData, Error>> {
    try {

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
      this.slackService.sendError(`Booking Svc >>> SubmitFormService : ${error.message}`);

      return Err(new Error('Failed to retrieve form by id'));
    }
  }
}