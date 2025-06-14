import { Inject, Injectable } from "@nestjs/common";
import { SlackService } from "src/infrastructure/adapters/slack/slack.service";
import { FavoriteRepository, ItemType } from "src/services/auth-svc/repository/favorite/favorite.repo";
import { EventFrontDisplayDto } from "src/services/event-svc/modules/event/queries/getEventFrontDisplay/getEventFrontDisplay-response.dto";

@Injectable()
export class CheckFavoriteService {
  constructor(
    @Inject('FavoriteRepository') private readonly favoriteRepository: FavoriteRepository,
    private readonly slackService: SlackService,
  ){}

  async execute(userId: string, orgId: string, eventId: number): Promise<[boolean, boolean, boolean, boolean]> {
    try {
      const favoriteEvent = await this.favoriteRepository.findOne({
          userId,
          itemType: ItemType.EVENT,
          eventId: eventId,
        }
      );

      const favoriteOrg = await this.favoriteRepository.findOne({
          userId,
          itemType: ItemType.ORG,
          orgId: orgId,
        }
      );
      const isFavoriteEvent = favoriteEvent ? favoriteEvent.isFavorite : false;
      const isNotifiedEvent = favoriteEvent ? favoriteEvent.isNotified : false;
      const isFavoriteOrg = favoriteOrg ? favoriteOrg.isFavorite : false;
      const isNotifiedOrg = favoriteOrg ? favoriteOrg.isNotified : false;

      return [isFavoriteEvent, isNotifiedEvent, isFavoriteOrg, isNotifiedOrg];
    } catch (error) {
      await this.slackService.sendError(`Auth Service - Check Favorite >>> ${error.message}`);
      
      return [false, false, false, false];
    }
  }

  async attachFavorite( userId: string, events: EventFrontDisplayDto[]): Promise<void> {
    for (const event of events) {
      try {
        const isFavoriteEvent = await this.favoriteRepository.findOne({
          userId,
          itemType: ItemType.EVENT,
          eventId: event.id,
        });

        event.isUserFavorite = isFavoriteEvent ? isFavoriteEvent.isFavorite : false;
        event.isUserNotice = isFavoriteEvent ? isFavoriteEvent.isNotified : false;
      } catch (error) {
        await this.slackService.sendError(`Auth Service - Attach Favorite >>> ${error.message}`);
        event.isUserFavorite = false;
        event.isUserNotice = false;
      }
    }
  }
}