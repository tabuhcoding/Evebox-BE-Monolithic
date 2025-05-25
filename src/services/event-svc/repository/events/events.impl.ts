import { Injectable } from '@nestjs/common';
import { Events, EventsRepository } from './events.repo';
import { PrismaService } from 'src/infrastructure/database/prisma/prisma.service';
import { BaseRepository } from 'src/shared/repo/base.repository';
import { Prisma } from '@prisma/client';
import { CreateEventDto } from 'src/services/event-svc/modules/event/commands/createEvent/createEvent.dto';
import { Result, Ok, Err } from 'oxide.ts';

@Injectable()
export class EventsRepositoryImpl
  extends BaseRepository<Events, Prisma.EventsDelegate>
  implements EventsRepository {
  constructor(protected readonly prisma: PrismaService) {
    super(prisma.events, prisma);
  }

   async findManyByIdsWithDetails(ids: number[]): Promise<Events[]> {
    return this.prisma.events.findMany({
      where: {
        id: { in: ids },
        deleteAt: null,
        isApproved: true,
      },
      include: {
        locations: {
          include: {
            districts: {
              include: {
                province: true,
              },
            },
          },
        },
        EventCategories: {
          include: {
            Categories: true,
          },
        },
        Showing: {
          include: {
            TicketType: true,
          },
        },
      },
    });
  }

  async createEvent(dto: CreateEventDto, email: string, locationId?: number): Promise<number> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { email },
      });

      if (!user) {
        throw new Error('User not found');
      }
      const result = await this.prisma.events.create({
        data: {
          title: dto.title,
          description: dto.description,
          isOnline: dto.isOnline ? true : false,
          locationId: locationId >> 0 || null,
          organizerId: email,
          venue: dto.venue,
          imgLogoUrl: dto.imgLogoUrl,
          imgPosterUrl: dto.imgPosterUrl,
          createdAt: new Date(),
          orgDescription: dto.orgDescription,
          orgName: dto.orgName,
          isOnlyOnEve: false,
          isSpecial: false,
          lastScore: 0,
          totalClicks: 0,
          weekClicks: 0,
          isApproved: false
        }
      });

      if (!result) {
        throw new Error('Failed to create event');
      }

      const eventUserRelationship = await this.prisma.eventUserRelationship.create({
        data: {
          eventId: result.id,
          userId: user.id,
          email: email || '',
          role: 3, // Assuming 3 is the role for organizer
          role_desc: 'organizer',
        },
      });

      if (!eventUserRelationship) {
        throw new Error('Failed to create event user relationship');
      }

      return result.id as number;
    } catch (error) {
      throw new Error(`Failed to create event: ${error.message}`);
    }
  }

  async createEventCategory(eventId: number, categoryIds: number[]): Promise<Result<any, Error>> {
    let parsedCategoryIds: number[];

    if (typeof categoryIds === 'string') {
      try {
        parsedCategoryIds = JSON.parse(categoryIds);
      } catch (error) {
        throw new Error('Failed to parsed category ids');
      }
    } else {
      parsedCategoryIds = categoryIds;
    }

    try {
      const categories = await this.prisma.categories.findMany({
        where: {
          id: {
            in: parsedCategoryIds
          }
        }
      })
      if (categories.length === 0) {
        return Err(new Error('Categories not found'));
      }
      
      const eventCategory = categories.map(category => {
        return {
          eventId: eventId,
          categoryId: category.id
        }
      })

      const result = await this.prisma.eventCategories.createMany({
        data: eventCategory
      });
      if (!result) {
        throw new Error('Failed to create event category');
      }
      return Ok(undefined);
    }
    catch (error) {
      return Err(new Error('Failed to create event category'));
    }
  }

  async createLocation(streetString: string, wardString: string, districtId: number): Promise<number> {
    try {
      const location = await this.prisma.locations.findFirst({
        where: {
          street: streetString,
          ward: wardString,
          districtId: districtId >> 0,
        },
      });
      if (location) {
        return location.id;
      }
      const result = await this.prisma.locations.create({
        data: {
          street: streetString,
          ward: wardString,
          districtId: districtId >> 0,
        },
      });

      if (!result) {
        throw new Error('Failed to create location');
      }

      return result.id;
    } catch (error) {
      throw new Error(`Failed to create location: ${error.message}`);
    }
  }
}
