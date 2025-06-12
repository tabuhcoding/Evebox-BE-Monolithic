import { Inject, Injectable } from "@nestjs/common";
import { Result, Ok, Err } from "oxide.ts";

import { TicketTypeRepository } from "src/services/event-svc/repository/ticketType/ticketType.repo";
import { ShowingRepository } from "src/services/event-svc/repository/showing/showing.repo";
import { SlackService } from "src/infrastructure/adapters/slack/slack.service";
import { CheckUserExistService } from "src/services/auth-svc/modules/user/commands/checkuserExist/checkuserExist.service";

@Injectable()
export class DeleteTicketTypeService {
  constructor(
    @Inject('TicketTypeRepository') private readonly ticketTypeRepository: TicketTypeRepository,
    @Inject('ShowingRepository') private readonly showingRepository: ShowingRepository,
    private readonly slackService: SlackService,
    private readonly checkUserExistService: CheckUserExistService
  ) {}

  async execute(id: string, userEmail: string): Promise<Result<string, Error>> {
    try {
      const ticketType = await this.ticketTypeRepository.findOneById(id);
      if (!ticketType) {
        return Err(new Error('Ticket type not found'));
      }

      const userExists = await this.checkUserExistService.execute(userEmail);
      if (!userExists) {
        return Err(new Error('User does not exist'));
      }

      const isAuthor = await this.showingRepository.checkAuthor(ticketType.showingId, userEmail);
      if (isAuthor.isErr()) {
        return Err(new Error('Failed to check author'));
      }

      if (!isAuthor.unwrap()) {
        return Err(new Error('You do not have permission to update showing'));
      }

      const result = await this.ticketTypeRepository.deleteTicketType(id);
      if (result.isErr()) {
        return Err(new Error(result.unwrapErr().message));
      }

      return result;
    } catch (error) {
      await this.slackService.sendError(`Event Service - Ticket type >>> DeleteTicketTypeService: ${error.message}`)
      return Err(new Error(`Failed to delete showing: ${error.message}`));
    }
  }
}