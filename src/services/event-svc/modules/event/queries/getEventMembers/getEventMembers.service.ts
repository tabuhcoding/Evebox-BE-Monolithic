import { Inject, Injectable } from "@nestjs/common";
import { Result, Ok, Err } from "oxide.ts";

import { EventsRepository } from "src/services/event-svc/repository/events/events.repo";
import { EventUserRelationshipRepository } from "src/services/event-svc/repository/eventUserRelationship/eventUserRelationship.repo";
import { EVENT_ROLE } from "../../domain/eventRole";
import { GetEventMembersQueryDto } from "./getEventMembers.dto";
import { GetEventMembersResponseDto } from "./getEventMembers-response.dto";
import { SlackService } from "src/infrastructure/adapters/slack/slack.service";
import { CheckUserExistService } from "src/services/auth-svc/modules/user/commands/checkuserExist/checkuserExist.service";
import { FindUserByEmailService } from "src/services/auth-svc/modules/user/commands/find-user-by-email/findUserByEmail.service";

@Injectable()
export class GetEventMembersService {
  constructor(
    @Inject('EventsRepository') private readonly eventsRepository: EventsRepository,
    @Inject('EventUserRelationshipRepository') private readonly eventUserRelaRepo: EventUserRelationshipRepository,
    private readonly slackService: SlackService,
    private readonly checkUserExistService: CheckUserExistService,
    private readonly findUserByEmail: FindUserByEmailService
  ) { }

  async execute(eventId: number, query: GetEventMembersQueryDto, userEmail: string): Promise<Result<GetEventMembersResponseDto, Error>> {
    try {
      const eventFound = await this.eventsRepository.findOneById(eventId);
      if (!eventFound) {
        return Err(new Error('Event not found'));
      }

      if (query.email) {
        const userExists = await this.checkUserExistService.execute(query.email);
        if (!userExists) {
          return Err(new Error('User does not exist'));
        }
      }

      const user = await this.findUserByEmail.execute(userEmail);
      if (!user) return Err(new Error('User not found'));

      const event = await this.eventsRepository.findOneById(eventId);
      if (!event) {
        return Err(new Error('Event not found'));
      }

      // const hasPermisison = await this.eventsRepository.hasPermissionToManageEvent(eventId, userEmail, EVENT_ROLE.VIEW_MEMBER);
      // if (hasPermisison.isErr()) {
      //   return Err(new Error('Failed to check permission'));
      // }

      // if (!hasPermisison.unwrap()) {
      //   return Err(new Error('You do not have permission to view member'));
      // }

      const members = await this.eventUserRelaRepo.findMany({
        eventId,
        isDeleted: false,
        ...(query.email ? { email: query.email } : {}),
      });

      const response: GetEventMembersResponseDto = {
        statusCode: 200,
        message: `Members of event ${eventId} retrieved successfully!`,
        data: members && members.length > 0 ? (
          members?.map((m) => ({
            eventId: m.eventId,
            userId: m.userId,
            email: m.email,
            role: m.role,
            role_desc: m.role_desc,
            createdAt: m.createdAt,
            updatedAt: m.updatedAt,
            isDeleted: m.isDeleted,
          }))
        ) : [],
      };

      response.data.push({
        eventId: eventId,
        userId: eventFound.organizerId,
        email: eventFound.organizerId,
        role: 1,
        role_desc: "Organizer",
        createdAt: new Date(),
        updatedAt: new Date(),
        isDeleted: false,
      });

      return Ok(response);
    } catch (error) {
      await this.slackService.sendError(`Event Service - Event member >>> GetEventMemberService: ${error.message}`);
      return Err(new Error('Failed to fetch members'));
    }
  }
}