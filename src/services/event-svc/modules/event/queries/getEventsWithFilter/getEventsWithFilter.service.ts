import { Inject, Injectable } from '@nestjs/common';
import { Result, Ok, Err } from 'oxide.ts';
import { EventsRepository } from 'src/services/event-svc/repository/events/events.repo';
import { EventFrontDisplayDto } from '../getEventFrontDisplay/getEventFrontDisplay-response.dto';
import { CheckFavoriteService } from 'src/services/auth-svc/modules/user/commands/check-favorite/checkFavorite.service';
import { SlackService } from 'src/infrastructure/adapters/slack/slack.service';

@Injectable()
export class SearchEventService {
  constructor(
    @Inject('EventsRepository') private readonly eventsRepository: EventsRepository,
    private readonly checkFavoriteService: CheckFavoriteService,
    private readonly slackService: SlackService,
  ) {}

  async execute(
    title: string,
    categories: string[],
    startDate?: string,
    endDate?: string,
    minPrice?: number,
    maxPrice?: number,
    take?: number,
    skip?: number,
    userId?: string,
  ): Promise<Result<EventFrontDisplayDto[], Error>> {
    try {
      const titleFilter = title
        ? {
            OR: [
              {
                title: {
                  contains: title,
                  mode: 'insensitive',
                },
              },
              {
                orgName: {
                  contains: title,
                  mode: 'insensitive',
                },
              },
            ],
          }
        : undefined;

      const categoryFilter =
        categories.length > 0
          ? {
              EventCategories: {
                some: {
                  Categories: {
                    name: {
                      in: categories,
                      mode: 'insensitive',
                    },
                  },
                },
              },
            }
          : undefined;

      const dateRangeOverlapFilter =
        startDate && endDate
          ? {
              AND: [
                {
                  nearlyEndDate: {
                    gte: new Date(startDate),
                  },
                },
                {
                  nearlyStartDate: {
                    lte: new Date(endDate),
                  },
                },
              ],
            }
          : undefined;

      const priceFilter =
        minPrice != null || maxPrice != null
          ? {
              minTicketPrice: {
                ...(minPrice != null && { gte: minPrice }),
                ...(maxPrice != null && { lte: maxPrice }),
              },
            }
          : undefined;

      const events = await this.eventsRepository.findMany(
        {
          deleteAt: null,
          isApproved: true,
          ...(titleFilter && titleFilter),
          ...(categoryFilter && categoryFilter),
          ...(dateRangeOverlapFilter && dateRangeOverlapFilter),
          ...(priceFilter && priceFilter),
        }, {},
        {
            nearlyEndDate: 'asc',
        },
          skip,
          take,
      );

      const formattedEvents = events.map((event): EventFrontDisplayDto => ({
        id: event.id,
        title: event.title,
        startDate: event.nearlyStartDate,
        lastScore: event.lastScore,
        imgPosterUrl: event.imgPosterUrl,
        imgLogoUrl: event.imgLogoUrl,
        totalClicks: event.totalClicks,
        weekClicks: event.weekClicks,
        minTicketPrice: event.minTicketPrice,

      }));

      if (userId) {
        await this.checkFavoriteService.attachFavorite(userId, formattedEvents);
      }

      return Ok(formattedEvents); // Assuming you're using Result<T, E> style
    } catch (error) {
      await this.slackService.sendError(`Error searching events: ${error.message}`);
      return Err(new Error(`Internal server error`));
    }
  }

}