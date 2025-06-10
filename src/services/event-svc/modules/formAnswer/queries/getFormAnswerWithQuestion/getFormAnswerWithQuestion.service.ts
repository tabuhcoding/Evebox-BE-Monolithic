import { Inject, Injectable } from "@nestjs/common";
import { Result, Ok, Err } from "oxide.ts";

import { FormAnswerRepository } from "src/services/event-svc/repository/formAnswer/formAnswer.repo";
import { SlackService } from "src/infrastructure/adapters/slack/slack.service";
import { UserFormAnserDto } from "src/services/booking-svc/modules/queries/getUserOrder/getUserOrder-response.dto";

@Injectable()
export class GetFormAnswerWithQuestionService {
  constructor(
    @Inject('FormAnswerRepository') private readonly formAnswerRepository: FormAnswerRepository,
    private readonly slackService: SlackService,
  ) {}

  async execute(formResponseId: number): Promise<UserFormAnserDto[]> {
    try {
      const formAnswers = await this.formAnswerRepository.findAll({
        formResponseId
      }, {
        FormInput: true,
      })  

      if (!formAnswers || formAnswers.length === 0) {
        return [];
      }

      const formattedAnswers = formAnswers.map(answer => ({
        fieldName: answer.FormInput.fieldName,
        value: answer.value,
      }));

      return formattedAnswers;
    } catch (error) {
      this.slackService.sendError(`Event Service - Delete form answer >>> DeleteFormAnswerService: ${error.message}`)

      return [];
    }
  }
}