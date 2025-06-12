import { Inject, Injectable } from "@nestjs/common";
import { Result, Ok, Err } from "oxide.ts";
import * as bcrypt from 'bcrypt';

import { ChangeUserPinCommand } from "./change-pin.command";
import { UserRepository } from "src/services/auth-svc/repository/users/user.repository";
import { Email } from "../../domain/value-objects/user/email.vo";
import { SlackService } from "src/infrastructure/adapters/slack/slack.service";

@Injectable()
export class ChangeUserPinService {
  constructor(
    @Inject('UserRepository') private readonly userRepository: UserRepository,
    private readonly slackService: SlackService
  ) { }

  async execute(command: ChangeUserPinCommand): Promise<Result<Boolean, Error>> {
    try {
      const emailResult = Email.create(command.email);
      if (emailResult.isErr()) {
        return Err(new Error('Invalid email format'));
      }

      const user = await this.userRepository.findByEmail(emailResult.unwrap());

      if (!user) {
        return Err(new Error('User not found'));
      }

      const existingPin = await this.userRepository.findPinStatusByEmail(emailResult.unwrap());

      if (!existingPin) {
        return Err(new Error('PIN does not exist for this user'));
      }

      // Verify current PIN matches
      const isPinValid = await bcrypt.compare(command.pin, existingPin.hashedPin);
      if (!isPinValid) {
        return Err(new Error('Current PIN is incorrect'));
      }

      const saltRounds = 10;
      const hashedPin = await bcrypt.hash(command.pin, saltRounds);

      await this.userRepository.updatePinUser(emailResult.unwrap(), hashedPin);

      return Ok(true);
    } catch (error) {
      await this.slackService.sendError(`Auth Service - User >>> ChangeUserPinService: ${error.message}`);

      return Err(new Error(`Failed to change PIN: ${error.message}`));
    }
  }
}