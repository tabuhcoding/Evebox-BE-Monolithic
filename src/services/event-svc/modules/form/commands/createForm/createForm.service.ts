import { Inject, Injectable } from "@nestjs/common";
import { Result, Ok, Err } from "oxide.ts";

import { FormRepository } from "src/services/event-svc/repository/form/form.repo";
import { CreateFormDto } from "./createForm.dto";
import { SlackService } from "src/infrastructure/adapters/slack/slack.service";
import { CheckUserExistService } from "src/services/auth-svc/modules/user/commands/checkuserExist/checkuserExist.service";

@Injectable()
export class CreateFormService {
  constructor(
    @Inject('FormRepository') private readonly formRepository: FormRepository,
    private readonly slackService: SlackService,
    private readonly checkUserExistService: CheckUserExistService
  ) { }

  async execute(dto: CreateFormDto, userEmail: string): Promise<Result<string, Error>> {
    try {
      const userExists = await this.checkUserExistService.execute(userEmail);
      if (!userExists) {
        return Err(new Error('User does not exist'));
      }

      if (!dto.name || dto.formInputs.length === 0) {
        return Err(new Error('Form name is required.'));
      }

      if (!dto.formInputs || dto.formInputs.length === 0) {
        return Err(new Error('At least one form input is required.'));
      }

      if (dto.formInputs.length > 20) {
        return Err(new Error('No more than 20 form inputs allowed.'));
      }

      for (const [index, input] of dto.formInputs.entries()) {
        if (!input.fieldName || !input.type || input.required === null) {
          return Err(new Error(`Form input at index ${index + 1} is required.`));
        }

        if (!input.type || !input.type || !input.type.trim()) {
          return Err(new Error(`Invalid type for form input at index ${index + 1}.`));
        }
      }

      const result = await this.formRepository.createForm(dto, userEmail);
      if (result.isErr()) {
        return Err(new Error(result.unwrapErr().message));
      }

      return result;
    } catch (error) {
      this.slackService.sendError(`EventSvc - Form >>> CreateFormService: ${error.message}`);

      return Err(new Error(`Failed to create form: ${error.message}`));
    }
  }
}