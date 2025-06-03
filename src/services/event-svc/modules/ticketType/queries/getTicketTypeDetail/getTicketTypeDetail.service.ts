import { Inject, Injectable } from "@nestjs/common";
import { SlackService } from "src/infrastructure/adapters/slack/slack.service";
import { TicketType, TicketTypeRepository } from "src/services/event-svc/repository/ticketType/ticketType.repo";

@Injectable()
export class GetTicketTypeDetailService {
  constructor(
    private readonly slackService: SlackService,
    @Inject('TicketTypeRepository') private readonly ticketTypeRepository: TicketTypeRepository,
  ){}

  async getTicketTypeDetail(ticketTypeId: string): Promise<TicketType | null> {
    try{
      const ticketType = await this.ticketTypeRepository.findOneById(ticketTypeId,
        {
          Showing: true,
          sections: true,
        }
      );
      if (!ticketType) {

        return null;
      }
      return ticketType;
    } catch (error) {
      this.slackService.sendError(`Event Svc >>> getTicketTypeDetail: ${error.message}`);
      
      return null;
    }
  }
}