import { Inject, Injectable } from "@nestjs/common";
import { Result, Ok, Err } from "oxide.ts";

import { FormRepository } from "src/services/event-svc/repository/form/form.repo";
import { SlackService } from "src/infrastructure/adapters/slack/slack.service";
import { CheckUserExistService } from "src/services/auth-svc/modules/user/commands/checkuserExist/checkuserExist.service";

@Injectable()
export class DeleteFormService {
  constructor(
    @Inject('FormRepository') private readonly formRepository: FormRepository, 
    private readonly slackService: SlackService,
    private readonly checkUserExistService: CheckUserExistService
  ) {}

  async execute(id: number, userEmail: string): Promise<Result<number, Error>> {
    try {
      const form = await this.formRepository.findOneById(id);
      if (!form) {
        return Err(new Error('Form not found'));
      }

      const userExists = await this.checkUserExistService.execute(userEmail);
      if (!userExists) {
        return Err(new Error('User does not exist'));
      }

      const isAuthor = await this.formRepository.checkAuthor(id, userEmail);

      if (isAuthor.isErr()) {
        return Err(new Error('Failed to check author'));
      }
      if (!isAuthor.unwrap()) {
        return Err(new Error('You do not have permission to delete form'));
      }

      const result = await this.formRepository.deleteForm(id);
      if (result.isErr()) {
        return Err(new Error(result.unwrapErr().message));
      }

      return result;
    } catch (error) {
      this.slackService.sendError(`Event Service - Form >>> DeleteFormService: ${error.message}`)
      return Err(new Error(`Failed to delete form: ${error.message}`));
    }
  }
}