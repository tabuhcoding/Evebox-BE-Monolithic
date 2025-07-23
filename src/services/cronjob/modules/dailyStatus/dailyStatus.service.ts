import { SaveRevenueDataService } from './../../../auth-svc/modules/admin/commands/saveRevenueData/saveRevenueData.service';
import { CalculateRevenueService } from './../../../booking-svc/modules/commands/calculateRevenue/calculateRevenue.service';
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
    private readonly calculateRevenueService: CalculateRevenueService,
    private readonly saveRevenueDataService: SaveRevenueDataService,
    private readonly slackService: SlackService,
  ) {
    // Initialization logic can go here if needed
  }

  @Cron('0 */2 * * *')
  async executeDailyStatusUpdate() {
    await this.slackService.sendNotice('Daily status update started.');
    try {
      // Call the service to recalculate ticket type status
      await this.calculateTicketTypeStatusService.execute();
      await this.slackService.sendNotice('Daily status update completed successfully.');
      await this.calculateTicketTypeStatusService.updateEvents();
      await this.slackService.sendNotice('Events updated successfully after daily status update.');
    }
    catch (error) {
      await this.slackService.sendError(`Daily status update failed: ${error.message}`);
    }
  }  

  @Cron('0 4 * * *')
  async executeDailyRevenueCalculation() {
    await this.slackService.sendNotice('Daily revenue calculation started.');
    try {
      // Get all unique dates in orders
      // const uniqueDates = await this.calculateRevenueService.getAllDatesInOrder();
      // for (const date of uniqueDates) {
      //   // const checkDateExist = await this.saveRevenueDataService.checkDateHasData(date);
      //   // if (checkDateExist) {
      //   //   await this.slackService.sendNotice(`Revenue data for ${date} already exists. Skipping.`);
      //   //   continue;
      //   // }
      //   await this.slackService.sendNotice(`Calculating revenue for date: ${date}`);
      //   // Calculate revenue for each date
      //   const revenueData = await this.calculateRevenueService.getRevenueByDateWithoutFail(date);
      //   if (revenueData.total_revenue > 0) {
      //     // Save the revenue data
      //     await this.saveRevenueDataService.saveRevenueData(revenueData);
      //     await this.slackService.sendNotice(`Revenue data for ${date} saved successfully.`);
      //   }
      // }
      // Calculate revenue for the previous day
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const checkDateExist = await this.saveRevenueDataService.checkDateHasData(yesterday.toISOString().split('T')[0]);
      if (checkDateExist) {
        return;
      }
      const revenueData = await this.calculateRevenueService.getRevenueByDate(yesterday.toISOString().split('T')[0]);
      await this.slackService.sendNotice(`Revenue data for ${yesterday.toISOString().split('T')[0]}: ${revenueData.total_revenue}`);
      await this.saveRevenueDataService.saveRevenueData(revenueData);
    } catch (error) {
      await this.slackService.sendError(`Daily revenue calculation failed: ${error.message}`);
    }
  }

  async executeRevenueCalculation() {
    await this.slackService.sendNotice('Daily revenue calculation started.');
    try {
      // Get all unique dates in orders
      const uniqueDates = await this.calculateRevenueService.getAllDatesInOrder();
      for (const date of uniqueDates) {
        const checkDateExist = await this.saveRevenueDataService.checkDateHasData(date);
        if (checkDateExist) {
          await this.slackService.sendNotice(`Revenue data for ${date} already exists. Skipping.`);
          continue;
        }
        await this.slackService.sendNotice(`Calculating revenue for date: ${date}`);
        // Calculate revenue for each date
        const revenueData = await this.calculateRevenueService.getRevenueByDateWithoutFail(date);
        if (revenueData.total_revenue > 0) {
          // Save the revenue data
          await this.saveRevenueDataService.saveRevenueData(revenueData);
          await this.slackService.sendNotice(`Revenue data for ${date} saved successfully. ${revenueData.total_revenue}`);
        }
      }
      await this.slackService.sendNotice('Calculating revenue for the day. success');
    } catch (error) {
      await this.slackService.sendError(`Daily revenue calculation failed: ${error.message}`);
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