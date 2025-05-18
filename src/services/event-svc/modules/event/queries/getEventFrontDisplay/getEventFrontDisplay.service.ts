import { Injectable, Inject } from '@nestjs/common';
import { Result, Ok, Err } from 'oxide.ts';
import { EventCategoriesSpectial, EventFrontDisplayDto, GetEventFrontDisplayDTO } from './getEventFrontDisplay-response.dto';
import { Events, EventsRepository } from 'src/services/event-svc/repository/events/events.repo';
import { calculateEventStatusAndMinPriceAndStartDate, EventStatus } from 'src/shared/utils/status/status';
import { CategoriesRepository } from 'src/services/event-svc/repository/categories/categories.repo';

@Injectable()
export class GetEventFrontDisplayService {
  constructor(
    @Inject('EventsRepository') private readonly eventsRepository: EventsRepository,
    @Inject('CategoriesRepository') private readonly categoriesRepository: CategoriesRepository,
  ) {}

  async execute(): Promise<Result<GetEventFrontDisplayDTO, Error>> {
    try {
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

      const result: GetEventFrontDisplayDTO = {
        specialEvents: specialEventsData,
        trendingEvents: trendingEventsData,
        onlyOnEve: onlyOnEveData,
        categorySpecial: categorySpecialData,

      };

      return Ok(result);
    } catch (error) {
      console.error(error);
      return Err(new Error('Failed to fetch front display data.'));
    }
  }

  async getSpecialEvents(): Promise<Result<EventFrontDisplayDto[], Error>> {
    try{
      // Get special events
      const specialEvents = await this.eventsRepository.findMany({
          isSpecial: true,
          deleteAt: null,
          Showing: {
            some: {
              startTime: {
                gte: new Date(),
              },
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
              },
            },
          },
          where: {
            startTime: {
              gte: new Date(),
            },
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
        Showing: {
          some: {
            startTime: {
              gte: new Date(),
            },
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
              },
            },
          },
          where: {
            startTime: {
              gte: new Date(),
            },
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
        Showing: {
          some: {
            startTime: {
              gte: new Date(),
            },
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
              },
            },
          },
          where: {
            startTime: {
              gte: new Date(),
            },
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
          Showing: {
            some: {
              startTime: {
                gte: new Date(),
              },
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
              },
            },
          },
          where: {
            startTime: {
              gte: new Date(),
            },
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

  async caculateEventStatusAndMinPriceAndStartDate(event: Events): Promise<Result<EventFrontDisplayDto, Error>> {
    try{
      // Calculate event status and min price
      const [status, minTicketPrice, startTime] = await calculateEventStatusAndMinPriceAndStartDate(event);

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
}
