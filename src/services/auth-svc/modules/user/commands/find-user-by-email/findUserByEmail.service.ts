import { Injectable } from "@nestjs/common";
import { SlackService } from "src/infrastructure/adapters/slack/slack.service";
import { UserRepositoryImpl } from "src/services/auth-svc/repository/users/user.repository.impl";
import { User } from "../../domain/entities/user.entity";

@Injectable()
export class FindUserByEmailService {
  constructor(
    private readonly userRepository: UserRepositoryImpl,
    private readonly slackService: SlackService,
  ) {}

  async execute(email: string): Promise<User> {
    try {
      // Check if the user exists by email
      const userExists = await this.userRepository.findUserByEmail(email);
      return userExists;
    } catch (error) {
      await this.slackService.sendError(`AuthSVC >>> Error checking user existence: ${error.message}`);

      return null;
    }
  }
}