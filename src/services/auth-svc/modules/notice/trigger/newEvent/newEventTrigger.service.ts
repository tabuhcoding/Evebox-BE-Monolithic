import { Inject, Injectable } from "@nestjs/common";
import { EmailService } from "src/infrastructure/adapters/email/email.service";
import { SlackService } from "src/infrastructure/adapters/slack/slack.service";
import { FavoriteRepository } from "src/services/auth-svc/repository/favorite/favorite.repo";
import { UserRepository } from "src/services/auth-svc/repository/users/user.repository";
import { CreateEventDto } from "src/services/event-svc/modules/event/commands/createEvent/createEvent.dto";

@Injectable()
export class NewEventTriggerService {
    constructor(
        @Inject('UserRepository') private readonly userRepository: UserRepository,
        @Inject('FavoriteRepository') private readonly favoriteRepository: FavoriteRepository,
        private readonly slackService: SlackService,
        private readonly emailService: EmailService,
    ) {}

    async sendEmailToAdmin(dto: CreateEventDto, orgId: string): Promise<void> {
        const adminEmails = await this.userRepository.findAllAdminEmails();
        await this.emailService.sendNewEventToAdmins(adminEmails, dto, orgId);
        await this.slackService.sendNotice(`
            New event created: ${dto.title} by ${orgId} with Info ${dto.orgName}. Description: ${dto.description}`);
    }

    async sendEmailToUsers(dto: CreateEventDto, orgId: string): Promise<void> {
        const userIds = await this.favoriteRepository.getUserIdsNotifiedByOrganizer(orgId);
        if (userIds.length === 0) return;

        // Extract user IDs from the result
        const emails = userIds.map(user => user.userId);

        await this.emailService.sendNewEventToUsers(emails, dto, orgId);
        await this.slackService.sendNotice(`
            New event created: ${dto.title} by ${orgId} with Info ${dto.orgName}. Description: ${dto.description}`);
    }

}