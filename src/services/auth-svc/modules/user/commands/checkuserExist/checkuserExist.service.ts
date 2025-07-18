import { Inject, Injectable } from "@nestjs/common";
import { SlackService } from "src/infrastructure/adapters/slack/slack.service";
import { AdminManageEventRepository, AREACODE } from "src/services/auth-svc/repository/admin-area/admin-area.repo";
import { UserRepositoryImpl } from "src/services/auth-svc/repository/users/user.repository.impl";

@Injectable()
export class CheckUserExistService {
  constructor(
    private readonly userRepository: UserRepositoryImpl,
    @Inject('AdminManageEventRepository') private readonly adminManageEventRepository: AdminManageEventRepository,
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
  async getAdminHasLeastTotalEvent(email: string, area_code: AREACODE): Promise<string | null> {
    try {
      const admins = await this.adminManageEventRepository.findMany({
        email: { not: email }, // Exclude the current user
        area_code: area_code,
      });

      if (admins.length === 0) return null;

      const adminWithLeastEvents = admins.reduce((prev, curr) => {
        return (prev.total_events || 0) < (curr.total_events || 0) ? prev : curr;
      });

      return adminWithLeastEvents.email;
    } catch (error) {
      await this.slackService.sendError(`AuthSVC >>> Error getting admin with least total events: ${error.message}`);
      return null;
    }
  }

  async increaseTotalEventsOfAdmin(email: string): Promise<void> {
    try {
      // Increase the totalEvents count for the admin
      await this.adminManageEventRepository.updateOne({
        email
      }, {
        total_events: { increment: 1 }
      });
    } catch (error) {
      await this.slackService.sendError(`AuthSVC >>> Error increasing total events for admin: ${error.message}`);
    }
  }
}