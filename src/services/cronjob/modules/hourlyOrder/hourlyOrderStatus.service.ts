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

  // Temp Cron job to run at 1h40 sunday
  // @Cron('0 40 1 * * 0')
  // async executeTempCron() {
  //   await this.slackService.sendNotice('Temporary cron job executed.');
  //   try {
  //     // Add any temporary logic here if needed
  //   } catch (error) {
  //     await this.slackService.sendError(`Temporary cron job failed: ${error.message}`);
  //   }
  // }
}