import { Inject, Injectable } from "@nestjs/common";
import { SlackService } from "src/infrastructure/adapters/slack/slack.service";
import { FormResponseRepository } from "src/services/event-svc/repository/formResponse/formResponse.repo";
import { ShowingRepository } from "src/services/event-svc/repository/showing/showing.repo";

@Injectable()
export class GetUserSubmitFormService {
  constructor(
    @Inject('FormResponseRepository') private readonly formResponseRepository: FormResponseRepository, // Replace 'any' with the actual type of OrderRepository
    @Inject('ShowingRepository') private readonly showingRepository: ShowingRepository,
    private readonly slackService: SlackService,
  ) {}

  async execute(showingID: string, userID: string): Promise<number | null> {
    try {
      // check if showing has form id
      const showing = await this.showingRepository.findOneById(showingID);
      if (!showing || !showing.formId) {
        this.slackService.sendError(`Event Svc >>> GetUserSubmitFormService >>> execute: No form found for showing ID ${showingID}`);
        return 0;
      }

      // find form responses by userId and showingId
      const formResponses = await this.formResponseRepository.findOne({
        userId: userID,
        showingId: showingID,
      });
      
      if (!formResponses) return null;

      return formResponses.id
      
    } catch (error) {
      this.slackService.sendError(`Event Svc >>> GetTotalTicketOfTicketTypeService >>> execute: ${error.message}`);
      
      return null;
    }
  }
}