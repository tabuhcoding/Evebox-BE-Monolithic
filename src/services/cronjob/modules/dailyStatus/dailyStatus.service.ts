import { Injectable } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { SlackService } from "src/infrastructure/adapters/slack/slack.service";
import { CalculateTicketTypeStatusService } from "src/services/event-svc/modules/showing/command/calculateTicketTypeStatus/calculateTicketTypeStatus.service";

@Injectable()
export class DailyStatusService {
  // This service is responsible for handling daily status updates.
  // Currently, it does not have any methods or properties.
  // You can add methods to fetch or update daily status as needed.
  
  constructor(
    private readonly calculateTicketTypeStatusService: CalculateTicketTypeStatusService,
    private readonly slackService: SlackService,
  ) {
    // Initialization logic can go here if needed
  }

  @Cron('0 0 * * *')
  async executeDailyStatusUpdate() {
    await this.slackService.sendNotice('Daily status update started.');
    try {
      // Call the service to recalculate ticket type status
      await this.calculateTicketTypeStatusService.execute();
      await this.slackService.sendNotice('Daily status update completed successfully.');
    }
    catch (error) {
      await this.slackService.sendError(`Daily status update failed: ${error.message}`);
    }
  }  

  // Cron job to run at 15h10 every day 
  // @Cron('47 16 * * *')
  // async executeDailyStatusUpdateAt15h10() {
  //   await this.slackService.sendNotice('Daily status update at 15h10 started.');
  //   try {
  //     // Call the service to recalculate ticket type status
  //     await this.calculateTicketTypeStatusService.updateEvents();
  //     await this.slackService.sendNotice('Daily status update at 15h10 completed successfully.');
  //   }
  //   catch (error) {
  //     await this.slackService.sendError(`Daily status update at 15h10 failed: ${error.message}`);
  //   }
  // }
}