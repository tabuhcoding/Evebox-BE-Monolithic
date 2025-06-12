import { Inject, Injectable } from "@nestjs/common";
import { Result, Ok, Err } from "oxide.ts";

import { UserRepository } from "src/services/auth-svc/repository/users/user.repository";
import { Email } from "../../domain/value-objects/user/email.vo";
import { UserPinStatusData } from "./get-pin-status.response.dto";
import { SlackService } from "src/infrastructure/adapters/slack/slack.service";
import { CheckUserExistService } from "../../commands/checkuserExist/checkuserExist.service";

@Injectable()
export class GetUserPinStatusService {
  constructor(
    @Inject('UserRepository') private readonly userRepository: UserRepository,
    private readonly slackService: SlackService,
    private readonly checkUserExistService: CheckUserExistService,
  ) { }

  async execute(email: string): Promise<Result<UserPinStatusData, Error>> {
    try {
      const userExists = await this.checkUserExistService.execute(email);
      if (!userExists) {
        return Err(new Error('User does not exist'));
      }
      
      const emailOrError = Email.create(email);
      if (emailOrError.isErr()) {
        return Err(new Error(emailOrError.unwrapErr().message));
      }

      const pinStatus = await this.userRepository.findPinStatusByEmail(emailOrError.unwrap());

      if (pinStatus != null) {
        const remainingAttempts = 5 - pinStatus.attempts;
        return Ok({
          requiresPinVerification: true,
          remainingAttempts: remainingAttempts,
          lockedUntil: pinStatus.lockedUntil,
        });
      }

      return Ok({
        requiresPinSetup: true,
      })
    } catch (error) {
      await this.slackService.sendError(`Auth Service - User >>> GetUserPinStatusService: ${error.message}`);

      return Err(new Error('Failed to get user pin status.'));
    }
  }
}