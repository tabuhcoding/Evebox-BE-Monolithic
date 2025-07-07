import { Inject, Injectable } from "@nestjs/common";
import { Err, Ok, Result } from "oxide.ts";
import { EventAdminDataDto } from "./getEvents-response.dto";
import { SlackService } from "src/infrastructure/adapters/slack/slack.service";
import { EventsRepository } from "src/services/event-svc/repository/events/events.repo";
import { CheckUserExistService } from "src/services/auth-svc/modules/user/commands/checkuserExist/checkuserExist.service";
import { GetEventsAdminDto } from "./getEventsAdmin.dto";
import { Pagination } from "src/shared/constants/pagination";

@Injectable()
export class GetEventsByAdminService {
  constructor(
    private readonly checkUserExistService: CheckUserExistService,
    @Inject('EventsRepository') private readonly eventRepository: EventsRepository,
    private readonly slackService: SlackService,
  ) { }

  async execute(filters: GetEventsAdminDto, email: string): Promise<Result<[EventAdminDataDto[], Pagination], Error>> {
    try {
      const userExists = await this.checkUserExistService.checkAdminExist(email);
      if (!userExists) {
        return Err(new Error('Unauthorized: User does not exist or is not an admin'));
      }

      const titleFilter = filters.title
        ? {
          OR: [
            {
              title: {
                contains: filters.title,
                mode: 'insensitive',
              },
            },
            {
              orgName: {
                contains: filters.title,
                mode: 'insensitive',
              },
            },
          ],
        }
        : undefined;

      const categoryFilter =
        filters.categoryId ? {
            EventCategories: {
              some: {
                categoryId: filters.categoryId >> 0,
              },
            },
          }
          : undefined;


      const isApprovedFilter = filters.isApproved !== undefined
        ? { isApproved: Boolean(filters.isApproved) }
        : undefined;

      const isDeletedFilter = filters.isDeleted !== undefined
        ? { deleteAt: Boolean(filters.isDeleted) ? { not: null } : null }
        : undefined;

      const timeStampFilter = filters.createdFrom || filters.createdTo
        ? {
          createdAt: {
            gte: filters.createdFrom ? new Date(filters.createdFrom) : undefined,
            lte: filters.createdTo ? new Date(filters.createdTo) : undefined,
          },
        }
        : undefined;

      const payloadFilters = {
        ...titleFilter,
        ...isApprovedFilter,
        ...isDeletedFilter,
        ...timeStampFilter,
        ...categoryFilter,
      };

      // Count total events
      const totalEvents = await this.eventRepository.count(
        payloadFilters,
      );

      if (totalEvents === 0) {
        return Ok([[], { page: 1, limit: filters.limit || 10, totalItems: 0, totalPages: 0 }]);
      }

      // Pagination
      const page = filters.page > 0 ? filters.page : 1;
      const limit = filters.limit > 0 ? filters.limit : 10;
      const totalPages = Math.ceil(totalEvents / limit);
      const skip = (page - 1) * limit;
      const pagination: Pagination = {
        totalItems: totalEvents,
        totalPages: totalPages,
        page: page,
        limit: limit,
      };

      // Fetch events with filters and pagination
      const events = await this.eventRepository.findMany(
        payloadFilters,
        {
          EventCategories: {
            include: {
              Categories: true,
            },
          },
          locations: {
            include: {
              districts: {
                include: {
                  province: true,
                },
              },
            },
          }
        },
        {
          createdAt: 'desc',
        },
        skip,
        limit
      );

      const formattedEvents = await Promise.all(
        events.map(async (event) => {
          const categories = event.EventCategories.map(ec => {
            return {
              id: ec.Categories.id,
              name: ec.Categories.name,
            };
          });

          return {
            id: event.id,
            title: event.title,
            createdAt: event.createdAt,
            deleteAt: event.deleteAt,
            organizerId: event.organizerId,
            imgLogoUrl: event.imgLogoUrl,
            imgPosterUrl: event.imgPosterUrl,
            locationString: `${event.locations?.street || ''}, ${event.locations?.ward || ''}, ${event.locations?.districts?.name || ''}, ${event.locations?.districts?.province?.name || ''}`,
            venue: event.venue,
            isApproved: event.isApproved,
            isSpecial: event.isSpecial,
            isOnlyOnEve: event.isOnlyOnEve,
            isOnline: event.isOnline,
            categories: categories,
          } as EventAdminDataDto;
        })
      );

      return Ok([formattedEvents, pagination]);
    } catch (error) {
      await this.slackService.sendError(`Event Svc >>> GetEventsByAdminService : ${error.message}`);
      return Err(new Error('Internal server error'));
    }
  }
}
