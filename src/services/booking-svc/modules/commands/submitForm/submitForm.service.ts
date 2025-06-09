import { Inject, Injectable } from "@nestjs/common";
import { Result, Ok, Err } from "oxide.ts";

import { SubmitFormDto } from "./submitForm.dto";
import { SubmitFormResponseData, FormAnswerResponseDto } from "./submitForm-response.dto";
import { TicketRepository } from "src/services/booking-svc/repository/ticket/ticket.repo";
import { SlackService } from "src/infrastructure/adapters/slack/slack.service";

@Injectable()
export class SubmitFormService {
  constructor(
    @Inject('TicketRepository') private readonly ticketRepository: TicketRepository,
    private readonly slackService: SlackService
  ) {}

  async execute (dto: SubmitFormDto, userId: string): Promise<Result<SubmitFormResponseData, Error>> {
    try {
      const isValidForm = await this.ticketRepository.checkValidForm(dto);
      if (isValidForm.isErr()) {
        return Err(new Error(isValidForm.unwrapErr().message));
      }

      if (!isValidForm.unwrap()) {
        return Err(new Error('Invalid form data'));
      }

      const formResponseData = await this.ticketRepository.submitForm(dto, userId);
      if (formResponseData.isErr()) {
        return Err(new Error(formResponseData.unwrapErr().message));
      }

      const formResponse = formResponseData.unwrap();
      if (!formResponse) {
        return Err(new Error('Failed to submit form'));
      }

      const formResponseFormatted = {
        formResponseId: formResponse.id,
        answers: formResponse.FormAnswer.map((answer: FormAnswerResponseDto) => ({
          id: answer.id,
          formInputId: answer.formInputId,
          value: answer.value,
        })),
      };

      return Ok(formResponseFormatted);
    } catch (error) {
      this.slackService.sendError(`Booking Svc >>> SubmitFormService : ${error.message}`);

      return Err(new Error('Failed to retrieve form by id'));
    }
  }
}