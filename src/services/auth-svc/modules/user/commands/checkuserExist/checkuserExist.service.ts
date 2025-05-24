import { Injectable } from "@nestjs/common";
import { SlackService } from "src/infrastructure/adapters/slack/slack.service";
import { UserRepositoryImpl } from "src/services/auth-svc/repository/users/user.repository.impl";

@Injectable()
export class CheckUserExistService {
  constructor(
    private readonly userRepository: UserRepositoryImpl,
    private readonly slackService: SlackService,
  ) {}

  async execute(email: string): Promise<boolean> {
    try {
      // Check if the user exists by email
      const userExists = await this.userRepository.isEmailExists(email);
      return userExists;
    } catch (error) {
      this.slackService.sendError(`AuthSVC >>> Error checking user existence: ${error.message}`);

      return false;
    }
  }
}