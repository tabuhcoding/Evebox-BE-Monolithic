import { Inject, Injectable } from "@nestjs/common";
import { SlackService } from "src/infrastructure/adapters/slack/slack.service";
import { GetTotalTicketOfTicketTypeService } from "src/services/booking-svc/modules/queries/getTotalTicketOfTicketType/getTotalTicketOfTicketType.service";
import { TicketTypeSectionRepository } from "src/services/event-svc/repository/ticketTypeSection/ticketTypeSection.repo";
import { SectionStatus } from "src/shared/utils/status/seatmap";

@Injectable()
export class CalculateSectionStatusService {
  constructor(
    @Inject('TicketTypeSectionRepository') private readonly ticketTypeSectionRepository: TicketTypeSectionRepository,
    private readonly slackService: SlackService,
    private readonly getTotalTicketOfTicketTypeService: GetTotalTicketOfTicketTypeService,
  ){}

  async calculateSectionStatus(ticketTypeIds: string[], sectionId: number): Promise<[SectionStatus, string | null]> {
    try{
      // Get all SectionTicketType
      const sectionTicketTypes = await this.ticketTypeSectionRepository.findOne({
        ticketTypeId: { in: ticketTypeIds },
        sectionId: sectionId,
      });

      if(!sectionTicketTypes) return [SectionStatus.NOT_SALE, null];

      // Check if TicketTypeSection is not sale
      if (sectionTicketTypes.quantity === 0) {
        return [SectionStatus.NOT_SALE, sectionTicketTypes.ticketTypeId];
      }
      // Get total ticket of section
      const totalTicketOfSection = await this.getTotalTicketOfTicketTypeService.getTotalTicketOfSection(sectionTicketTypes.ticketTypeId, sectionId);
      if (totalTicketOfSection === null) {
        await this.slackService.sendError(`Booking Svc >>> getTotalTicketOfSection : Failed to get total tickets for section ${sectionId} of ticket type ${sectionTicketTypes.ticketTypeId}`);
        return [SectionStatus.NOT_SALE, sectionTicketTypes.ticketTypeId];
      }

      // Check if total ticket of section is greater than TicketTypeSection quantity
      if (totalTicketOfSection >= sectionTicketTypes.quantity) {
        return [SectionStatus.SOLD_OUT, sectionTicketTypes.ticketTypeId];
      } else {
        return [SectionStatus.AVAILABLE, sectionTicketTypes.ticketTypeId];
      }
    }
    catch (error) {
      await this.slackService.sendError(`Event Svc >>> calculateSectionStatus: ${error.message}`);
      return [SectionStatus.NOT_SALE, null];
    }
  }
}