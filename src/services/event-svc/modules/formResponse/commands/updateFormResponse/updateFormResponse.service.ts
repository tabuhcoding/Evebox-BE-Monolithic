import { Inject, Injectable } from "@nestjs/common";
import { Result, Ok, Err } from "oxide.ts";

import { UpdateFormResponseDto } from "./updateFormResponse.dto";
import { FormResponseRepository } from "src/services/event-svc/repository/formResponse/formResponse.repo";
import { SlackService } from "src/infrastructure/adapters/slack/slack.service";

@Injectable()
export class UpdateFormResponseService {
  constructor(
    @Inject('FormResponseRepository') private readonly formResponseRepository: FormResponseRepository,
    private readonly slackService: SlackService,
  ) { }

  async execute(dto: UpdateFormResponseDto, id: string): Promise<Result<any, Error>> {
    try {
      const formResponse = await this.formResponseRepository.updateAndFindOneById(id,
        {
          FormAnswer: {
            create: dto.answers.map((answer) => ({
              formInputId: answer.formInputId,
              value: answer.value,
            }))
          }
        },
        {
          FormAnswer: true // Lấy luôn danh sách câu trả lời sau khi cập nhật
        }
      )

      if (!formResponse) {
        return Err(new Error('Failed to update form response'));
      }

      return Ok(formResponse);
    } catch (error) {
      this.slackService.sendError(`Event Service - Update form response >>> UpdateFormResponseService: ${error.message}`)

      return Err(new Error(`Failed to update form response: ${error.message}`));
    }
  }
}