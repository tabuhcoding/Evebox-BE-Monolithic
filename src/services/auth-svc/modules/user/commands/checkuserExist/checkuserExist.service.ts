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
      await this.slackService.sendError(`AuthSVC >>> Error checking user existence: ${error.message}`);

      return false;
    }
  }

  async checkAdminExist(email: string): Promise<boolean> {
    try {
      // Check if the user exists by email and is an admin
      const userExists = await this.userRepository.isEmailExists(email);
      if (!userExists) return false;

      const isAdmin = await this.userRepository.isAdmin(email);
      return isAdmin;
    } catch (error) {
      await this.slackService.sendError(`AuthSVC >>> Error checking admin existence: ${error.message}`);
      return false;
    }
  }

  // get the admin has the least total event 
  async getAdminHasLeastTotalEvent(email: string): Promise<string | null> {
    try {
      const admins = await this.userRepository.findMany({
        role_id: 1, // Assuming 1 is the role_id for admin
        email: { not: email }, // Exclude the current user
      }, {
        totalEvents: true,
      });

      if (admins.length === 0) return null;

      // Sort admins by totalEvents and return the one with the least
      const adminWithLeastEvents = admins.reduce((prev, curr) => {
        return (prev.totalEvents || 0) < (curr.totalEvents || 0) ? prev : curr;
      });

      return adminWithLeastEvents.email.toString();
    } catch (error) {
      await this.slackService.sendError(`AuthSVC >>> Error getting admin with least total events: ${error.message}`);
      return null;
    }
  }

  async increaseTotalEventsOfAdmin(email: string): Promise<void> {
    try {
      // Increase the totalEvents count for the admin
      await this.userRepository.increaseTotalEvents(email);
    } catch (error) {
      await this.slackService.sendError(`AuthSVC >>> Error increasing total events for admin: ${error.message}`);
    }
  }
}