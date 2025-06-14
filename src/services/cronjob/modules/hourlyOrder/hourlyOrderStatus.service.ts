import { Injectable } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { SlackService } from "src/infrastructure/adapters/slack/slack.service";
import { RecheckOrderMissedService } from "src/services/booking-svc/modules/commands/recheckOrderMissed/recheckOrderMissed.service";

@Injectable()
export class HourlyOrderStatusService {
  // This service is responsible for handling daily status updates.
  // Currently, it does not have any methods or properties.
  // You can add methods to fetch or update daily status as needed.
  
  constructor(
    private readonly slackService: SlackService,
    private readonly recheckOrderMissedService: RecheckOrderMissedService,
  ) {
    // Initialization logic can go here if needed
  }

  // Cron job to run every 2 hours
  @Cron('0 */2 * * *')
  async execueHourlyOrderStatus() {
    await this.slackService.sendNotice('Hourly order status update started.');
    try {
      await this.recheckOrderMissedService.execute();
    }
    catch (error) {
      await this.slackService.sendError(`Hourly order status update failed: ${error.message}`);
    }
  }  
}