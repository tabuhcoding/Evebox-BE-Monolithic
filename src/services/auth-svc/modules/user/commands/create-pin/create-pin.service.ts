import { Inject, Injectable } from "@nestjs/common";
import { Result, Ok, Err } from "oxide.ts";
import * as bcrypt from 'bcrypt';

import { CreatePinUserCommand } from "./create-pin.command";
import { UserRepository } from "src/services/auth-svc/repository/users/user.repository";
import { Email } from "../../domain/value-objects/user/email.vo";
import { SlackService } from "src/infrastructure/adapters/slack/slack.service";
import { CheckUserExistService } from "../checkuserExist/checkuserExist.service";

@Injectable()
export class CreateUserPinService {
  constructor(
    @Inject('UserRepository') private readonly userRepository: UserRepository, 
    private readonly slackService: SlackService,
    private readonly checkUserExistService: CheckUserExistService
  ) {}

  async execute(command: CreatePinUserCommand): Promise<Result<Boolean, Error>> {
    try {
      const userExists = await this.checkUserExistService.execute(command.email);
      if (!userExists) {
        return Err(new Error('User does not exist'));
      }

      const emailResult = Email.create(command.email);
      if (emailResult.isErr()) {
        return Err(new Error('Invalid email format'));
      }
      
      const user = await this.userRepository.findByEmail(emailResult.unwrap());
      if (!user) {
        return Err(new Error('User not found'));
      }
      
      const existingPin = await this.userRepository.findPinStatusByEmail(emailResult.unwrap());
      
      if (existingPin) {
        return Err(new Error('PIN already exists for this user'));
      }
      
      // Hash the PIN (using bcrypt with salt rounds of 10)
      const saltRounds = 10;
      const hashedPin = await bcrypt.hash(command.pin, saltRounds);
      
      // Create new PIN
      await this.userRepository.createPinUser(emailResult.unwrap(), hashedPin);
      
      return Ok(true);
    } catch (error) {
      this.slackService.sendError(`Auth Service - User >>> GetUserPinStatusService: ${error.message}`);

      return Err(new Error(`Failed to create PIN: ${error.message}`));
    }
  }
}