import { Injectable, Inject } from '@nestjs/common';
import { Result, Ok, Err } from 'oxide.ts';
import { EventCategoriesSpectial, EventFrontDisplayDto, GetEventFrontDisplayDTO } from './getEventFrontDisplay-response.dto';
import { Events, EventsRepository } from 'src/services/event-svc/repository/events/events.repo';
import { calculateEventStatusAndMinPriceAndStartDate, EventStatus } from 'src/shared/utils/status/status';
import { CategoriesRepository } from 'src/services/event-svc/repository/categories/categories.repo';
import { SlackService } from 'src/infrastructure/adapters/slack/slack.service';
import { FileCacheService } from 'src/infrastructure/cache/fileCache/fileCache.service';
import { CheckFavoriteService } from 'src/services/auth-svc/modules/user/commands/check-favorite/checkFavorite.service';
import { GetFavoriteEventService } from 'src/services/auth-svc/modules/user/queries/get-favorite-event/get-favorite-event.service';
import { OpenAIVectorStoreService } from 'src/services/rag-svc/modules/openai/core-embedding/vector-store.service';

interface eventScore {
    id: number;
    score: number;
}
@Injectable()
export class GetEventFrontDisplayService {
  constructor(
    @Inject('EventsRepository') private readonly eventsRepository: EventsRepository,
    @Inject('CategoriesRepository') private readonly categoriesRepository: CategoriesRepository,
    private readonly slackService: SlackService,
    private readonly fileCacheService: FileCacheService,
    private readonly checkFavoriteService: CheckFavoriteService,
    private readonly getFavoriteEventService: GetFavoriteEventService,
    private readonly vectorStoreService: OpenAIVectorStoreService,
  ) {}

  async execute(userId?: string): Promise<Result<GetEventFrontDisplayDTO, Error>> {
    try {      
      // Check if data is cached
      const cachedData = await this.fileCacheService.getCache('getEventFrontDisplay', {}) as GetEventFrontDisplayDTO;
      if (cachedData) {
        // Attach favorite status to cached data
        if (userId) {
          const favoriteEvents = await this.getEventRecommentForUser(userId);

          await this.checkFavoriteService.attachFavorite(userId, favoriteEvents);
          await this.checkFavoriteService.attachFavorite(userId, cachedData.specialEvents);
          await this.checkFavoriteService.attachFavorite(userId, cachedData.trendingEvents);
          await this.checkFavoriteService.attachFavorite(userId, cachedData.onlyOnEve);
          for (const category of cachedData.categorySpecial) {
            await this.checkFavoriteService.attachFavorite(userId, category.events);
          }
        }
        return Ok(cachedData);
      }

      // Fetch special events, trending events, only on eve events, and special events by category
      const specialEvents = await this.getSpecialEvents();
      if (specialEvents.isErr()) {
        return Err(new Error('Failed to fetch special events.'));
      }
      const specialEventsData = specialEvents.unwrap();

      const trendingEvents = await this.getTrendingEvents();
      if (trendingEvents.isErr()) {
        return Err(new Error('Failed to fetch trending events.'));
      }
      const trendingEventsData = trendingEvents.unwrap();

      const onlyOnEve = await this.getOnlyOnEveEvents();
      if (onlyOnEve.isErr()) {
        return Err(new Error('Failed to fetch only on eve events.'));
      }
      const onlyOnEveData = onlyOnEve.unwrap();

      const categorySpecial = await this.getSpecialEventsByCategory();
      if (categorySpecial.isErr()) {
        return Err(new Error('Failed to fetch special events by category.'));
      }
      const categorySpecialData = categorySpecial.unwrap();

      var result: GetEventFrontDisplayDTO = {
        specialEvents: specialEventsData,
        trendingEvents: trendingEventsData,
        onlyOnEve: onlyOnEveData,
        categorySpecial: categorySpecialData,
        recommendedEvents: []
      };

      // Cache the result without await
      this.fileCacheService.cacheEndpoint('getEventFrontDisplay', 360, {}, result); // Cache for 12 hour

      // Attach favorite status if userId is provided
      if (userId) {
        const recommendedEvents = await this.getEventRecommentForUser(userId);
        result.recommendedEvents = recommendedEvents;
        await this.checkFavoriteService.attachFavorite(userId, result.recommendedEvents);
        await this.checkFavoriteService.attachFavorite(userId, result.specialEvents);
        await this.checkFavoriteService.attachFavorite(userId, result.trendingEvents);
        await this.checkFavoriteService.attachFavorite(userId, result.onlyOnEve);
        for (const category of result.categorySpecial) {
          await this.checkFavoriteService.attachFavorite(userId, category.events);
        }
      }

      return Ok(result);
    } catch (error) {
      // send error to slack
      await this.slackService.sendError(`EventSvc - Event >>> GetEventFrontDisplayService: ${error.message}`);

      return Err(new Error('Failed to fetch front display data.'));
    }
  }

  async getSpecialEvents(): Promise<Result<EventFrontDisplayDto[], Error>> {
    try{
      // Get special events
      const specialEvents = await this.eventsRepository.findMany({
          isSpecial: true,
          deleteAt: null,
          isApproved: true,
          Showing: {
            some: {
              startTime: {
                gte: new Date(),
              },
              deleteAt: null,
            },
          }
        },
        {
          Showing: {
            select: {
              id: true,
              startTime: true,
              TicketType: {
                select: {
                  id: true,
                  price: true,
                  status: true,
                },
              },
            },
            where: {
              startTime: {
                gte: new Date(),
              },
              deleteAt: null,
            },
          }
        }
      );

      // Map to EventFrontDisplayDto
      const specialEventsDto = await Promise.all(specialEvents.map(async (event) => {
        const result = await this.caculateEventStatusAndMinPriceAndStartDate(event);
        if (result.isErr()) {
          return null;
        }
        return result.unwrap();
      }));

      // Filter out null values
      const filteredSpecialEvents = specialEventsDto.filter((event) => event !== null
        && event.status !== EventStatus.EVENT_OVER 
        && event.status !== EventStatus.SOLD_OUT
        && event.status !== EventStatus.REGISTER_CLOSE
        && event.status !== EventStatus.SALE_CLOSE
      ) as EventFrontDisplayDto[];
      return Ok(filteredSpecialEvents);
    }
    catch (error) {
      console.error(error);
      return Err(new Error('Failed to fetch special events.'));
    }
  }

  async getOnlyOnEveEvents(): Promise<Result<EventFrontDisplayDto[], Error>> {
    try{
      // Get only on eve events
      const onlyOnEveEvents = await this.eventsRepository.findMany({
        isOnlyOnEve: true,
        deleteAt: null,
        isApproved: true,
        Showing: {
          some: {
            startTime: {
              gte: new Date(),
            },
            deleteAt: null,
          },
        }
      },
      {
        Showing: {
          select: {
            id: true,
            startTime: true,
            TicketType: {
              select: {
                id: true,
                price: true,
                status: true,
              },
            },
          },
          where: {
            startTime: {
              gte: new Date(),
            },
            deleteAt: null,
          },
        }
      }
      );

      // Map to EventFrontDisplayDto
      const onlyOnEveEventsDto = await Promise.all(onlyOnEveEvents.map(async (event) => {
        const result = await this.caculateEventStatusAndMinPriceAndStartDate(event);
        if (result.isErr()) {
          return null;
        }
        return result.unwrap();
      }));

      // Filter out null values
      const filteredOnlyOnEveEvents = onlyOnEveEventsDto.filter((event) => event !== null
        && event.status !== EventStatus.EVENT_OVER 
        && event.status !== EventStatus.SOLD_OUT
        && event.status !== EventStatus.REGISTER_CLOSE
        && event.status !== EventStatus.SALE_CLOSE
      ) as EventFrontDisplayDto[];
      return Ok(filteredOnlyOnEveEvents);
    }
    catch (error) {
      console.error(error);
      return Err(new Error('Failed to fetch only on eve events.'));
    }
  }

  async getTrendingEvents(): Promise<Result<EventFrontDisplayDto[], Error>> {
    try{
      const now = new Date();

      // Calculate the start and end of the week
      const daysSinceMonday = now.getDay() === 0 ? 6 : now.getDay() - 1; // 0 là Chủ Nhật, nên đổi thành 6

      // Get trending events
      const events = await this.eventsRepository.findMany({
        deleteAt: null,
        isApproved: true,
        Showing: {
          some: {
            startTime: {
              gte: new Date(),
            },
            deleteAt: null,
          },
        }
      },
      {
        Showing: {
          select: {
            id: true,
            startTime: true,
            TicketType: {
              select: {
                id: true,
                price: true,
                status: true,
              },
            },
          },
          where: {
            startTime: {
              gte: new Date(),
            },
            deleteAt: null,
          },
        }
      });

      // Calculate scores
      // Lấy điểm số của các sự kiện trong tuần
      // Chia cho số ngày đã qua trong tuần để tính điểm trung bình
      // Lấy điểm số lớn hơn giữa lastScore và calculatedScore
      // Sắp xếp theo maxScore giảm dần
      // Lấy 20 sự kiện hàng đầu
      const trendingEvents = events
      .map(event => {
        const calculatedScore = event.weekClicks / (daysSinceMonday + 1); // Tránh chia cho 0
        const maxScore = Math.max(Number(event.lastScore), calculatedScore); // Lấy điểm lớn hơn giữa lastScore và calculatedScore
        return {
          ...event,
          calculatedScore,
          maxScore,
        };
      })
      .sort((a, b) => b.maxScore - a.maxScore) // Sắp xếp theo maxScore giảm dần
      .slice(0, 20);

      // Map to EventFrontDisplayDto
      const trendingEventsDto = await Promise.all(trendingEvents.map(async (event) => {
        const result = await this.caculateEventStatusAndMinPriceAndStartDate(event);
        if (result.isErr()) {
          return null;
        }
        return result.unwrap();
      }));

      // Filter out null values
      const filteredTrendingEvents = trendingEventsDto.filter((event) => event !== null
        && event.status !== EventStatus.EVENT_OVER 
        && event.status !== EventStatus.SOLD_OUT
        && event.status !== EventStatus.REGISTER_CLOSE
        && event.status !== EventStatus.SALE_CLOSE
    ) as EventFrontDisplayDto[];
      return Ok(filteredTrendingEvents);
    }
    catch (error) {
      console.error(error);
      return Err(new Error('Failed to fetch trending events.'));
    }
  }

  async getSpecialEventsByCategory(): Promise<Result<EventCategoriesSpectial[], Error>> {
    try{
      // Get all categories
      const categories = await this.categoriesRepository.findMany({});

      // categorySpecial
      const categorySpecials = [];

      for (const category of categories) {
        const events = await this.eventsRepository.findMany({
          EventCategories: {
            some: {
              categoryId: category.id,
              isSpecial: true,
            },
          },
          deleteAt: null,
          isApproved: true,
          Showing: {
            some: {
              endTime: {
                gte: new Date(new Date().setMonth(new Date().getMonth() - 1)),
              },
              deleteAt: null,
            },
          }
        },
        {
        Showing: {
          select: {
            id: true,
            startTime: true,
            TicketType: {
              select: {
                id: true,
                price: true,
                status: true,
              },
            },
          },
          where: {
            endTime: {
              gte: new Date(new Date().setMonth(new Date().getMonth() - 1)),
            },
            deleteAt: null,
          },
        },
        EventCategories: true,
        });

        // Map to EventFrontDisplayDto
        const eventsDto = await Promise.all(events.map(async (event) => {
          const result = await this.caculateEventStatusAndMinPriceAndStartDate(event);
          if (result.isErr()) {
            return null;
          }
          return result.unwrap();
        }));

        // Filter out null values and status is not SoldOut Or EventOver
        const filteredEvents = eventsDto.filter((event) => event !== null 
        && event.status !== EventStatus.EVENT_OVER 
        && event.status !== EventStatus.SOLD_OUT
        && event.status !== EventStatus.REGISTER_CLOSE
        && event.status !== EventStatus.SALE_CLOSE
      ) as EventFrontDisplayDto[];

        categorySpecials.push({
          category,
          events: filteredEvents,
        });
      }
      return Ok(categorySpecials);
    }
    catch (error) {
      console.error(error);
      return Err(new Error('Failed to fetch special events by category.'));
    }
  }

  async caculateEventStatusAndMinPriceAndStartDate(event: Events, timeStamp: number = 1): Promise<Result<EventFrontDisplayDto, Error>> {
    try{
      // Calculate event status and min price
      const [status, minTicketPrice, startTime] = await calculateEventStatusAndMinPriceAndStartDate(event, timeStamp);

      // Map to EventFrontDisplayDto
      const eventFrontDisplayDto: EventFrontDisplayDto = {
        id: event.id,
        title: event.title,
        startDate: startTime,
        lastScore: event.lastScore,
        imgPosterUrl: event.imgPosterUrl,
        imgLogoUrl: event.imgLogoUrl,
        totalClicks: event.totalClicks,
        weekClicks: event.weekClicks,
        minTicketPrice,
        status,
      };

      return Ok(eventFrontDisplayDto);
    }
    catch (error) {
      console.error(error);
      return Err(new Error('Failed to calculate event status and min price.'));
    }
  }
  
  async getEventRecommentForUser(email: string): Promise<EventFrontDisplayDto[]> {
    if (!email) {
      return [];
    }
    try {
      const eventRecommentForUserCache = await this.fileCacheService.getCache('getEventRecommentForUser', {userId: email}) as EventFrontDisplayDto[];
      if (eventRecommentForUserCache) {
        return eventRecommentForUserCache;
      }
      var eventScoresMap: Map<number, number> = new Map();

      const cacheScore = await this.fileCacheService.getCache('eventScoresMap', {userId: email}) as { eventScoreMap: eventScore[] } | null;
      console.log(`Cache score map for user ${email}:`, cacheScore);
      if (cacheScore) {
        eventScoresMap = new Map(cacheScore.eventScoreMap.map(item => [item.id, item.score]));
      } else {
        const favoriteEvents = await this.getFavoriteEventService.getFavoriteEventIDs(email);
        const favoriteEventsToString = favoriteEvents.map(eventId => eventId.toString());
        
        const userEventsSimilar = await this.vectorStoreService.recommendEventsFromFavorites(favoriteEventsToString, 1000);

        if (userEventsSimilar.length === 0) {
          return [];
        }
        // Create a map of score and event ID
        
        for (const event of userEventsSimilar) {
          eventScoresMap.set(event[0].metadata.eventId, event[1]);
        }

        // Convert Map to array of eventScore
        const eventScoresArray: eventScore[] = Array.from(eventScoresMap, ([id, score]) => ({ id, score }));

        this.fileCacheService.cacheEndpoint('similar_events', 60*24, {
          userId: email,
        }, { eventScoreMap: eventScoresArray }); // Cache for 24 hours
      }

      const events = await this.eventsRepository.findMany({
        id: {
          in: Array.from(eventScoresMap.keys()),
        },
        deleteAt: null,
        isApproved: true,
        Showing: {
          some: {
            startTime: {
              gte: new Date(),
            },
            deleteAt: null,
          },
        }
      }, {
        Showing: {
          select: {
            id: true,
            startTime: true,
            TicketType: {
              select: {
                id: true,
                price: true,
                status: true,
              },
            },
          },
          where: {
            startTime: {
              gte: new Date(),
            },
            deleteAt: null,
          },
        }
      });

      console.log(`Events found for user ${email}:`, events.length);

      // Map to EventFrontDisplayDto
      const eventFrontDisplayDtos = await Promise.all(events.map(async (event) => {
        const result = await this.caculateEventStatusAndMinPriceAndStartDate(event);
        if (result.isErr()) {
          return null;
        }
        return result.unwrap();
      }));

      // Filter out null values and status is not SoldOut Or EventOver
      const filteredEvents = eventFrontDisplayDtos.filter((event) => event !== null) as EventFrontDisplayDto[];
      
      // Sort by map score of vector store and then by status
      filteredEvents.sort((a, b) => {
        const scoreA = eventScoresMap.get(a.id) || 0;
        const scoreB = eventScoresMap.get(b.id) || 0;

        // Sort by status first
        if (a.status === EventStatus.AVAILABLE && b.status !== EventStatus.AVAILABLE) {
          return -1; // a is available, b is not
        } else if (b.status === EventStatus.AVAILABLE && a.status !== EventStatus.AVAILABLE) {
          return 1; // b is available, a is not
        }

        // Sort by score first
        if (scoreB !== scoreA) {
          return scoreB - scoreA;
        }

        // If scores are equal, sort by status
        return 0;
      });

      await this.fileCacheService.cacheEndpoint('getEventRecommentForUser', 360, {userId: email}, filteredEvents.slice(0, 10)); // Cache for 24 hours

      return filteredEvents;
    }
    catch (error) {
      // console.error(error);
      await this.slackService.sendError(`EventSvc - Event >>> GetEventRecommentForUser: ${error.message}`);
      return [];
    }
  }
}
