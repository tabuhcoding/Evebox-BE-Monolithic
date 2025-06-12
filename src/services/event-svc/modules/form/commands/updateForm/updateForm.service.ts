import { Inject, Injectable } from "@nestjs/common";
import { Result, Ok, Err } from "oxide.ts";

import { FormRepository } from "src/services/event-svc/repository/form/form.repo";
import { UpdateFormDto } from "./updateForm.dto";
import { CheckUserExistService } from "src/services/auth-svc/modules/user/commands/checkuserExist/checkuserExist.service";
import { SlackService } from "src/infrastructure/adapters/slack/slack.service";

@Injectable()
export class UpdateFormService {
  constructor(
    @Inject('FormRepository') private readonly formRepository: FormRepository,
    private readonly slackService: SlackService,
    private readonly checkUserExistService: CheckUserExistService, 
  ) {}

  async execute(dto: UpdateFormDto & { id: number, userEmail: string }): Promise<Result<number, Error>> {
    try {
      const form = await this.formRepository.findOneById(dto.id);
      if (!form) {
        return Err(new Error('Form not found'));
      }

      const userExists = await this.checkUserExistService.execute(dto.userEmail);
      if (!userExists) {
        return Err(new Error('User does not exist'));
      }

      const isAuthor = await this.formRepository.checkAuthor(dto.id, dto.userEmail);
      if (isAuthor.isErr()) {
        return Err(new Error('Failed to check author'));
      }
      if (!isAuthor.unwrap()) {
        return Err(new Error('You do not have enough permission to update form'));
      }

      const result = await this.formRepository.updateForm(dto);
      if (result.isErr()) {
        return Err(new Error(result.unwrapErr().message));
      }

      return result;
    } catch (error) {
      await this.slackService.sendError(`Event Service - Form >>> UpdateFormService: ${error.message}`);
      return Err(new Error(`Error updating form: ${error.message}`));
    }
  }
}