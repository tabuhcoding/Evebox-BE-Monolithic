import { Injectable } from '@nestjs/common';
import { Events, EventsRepository } from './events.repo';
import { PrismaService } from 'src/infrastructure/database/prisma/prisma.service';
import { BaseRepository } from 'src/shared/repo/base.repository';
import { Prisma } from '@prisma/client';
import { CreateEventDto } from '../../modules/event/commands/createEvent/createEvent.dto';
import { UpdateEventDto } from '../../modules/event/commands/updateEvent/updateEvent.dto';
import { Result, Ok, Err } from 'oxide.ts';

@Injectable()
export class EventsRepositoryImpl
  extends BaseRepository<Events, Prisma.EventsDelegate>
  implements EventsRepository {
  constructor(protected readonly prisma: PrismaService) {
    super(prisma.events, prisma);
  }

  /* Create Event */
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
  
  /* Update Event */
  async updateEvent(dto: UpdateEventDto, eventId: number, email: string, locationId?: number): Promise<number> {
    try {
      const event = await this.findOneById(eventId);
      if (!event) {
        throw new Error('Event not found');
      }

      const updateData: any = {};
      if (dto.title) updateData.title = dto.title;
      if (dto.description) updateData.description = dto.description;
      if (dto.imgLogoUrl) updateData.imgLogoUrl = dto.imgLogoUrl;
      if (dto.imgPosterUrl) updateData.imgPosterUrl = dto.imgPosterUrl;
      if (dto.orgName) updateData.orgName = dto.orgName;
      if (dto.orgDescription) updateData.orgDescription = dto.orgDescription;
      if (dto.isOnline !== undefined) {
        if (updateData.isOnline) {
          updateData.locationId = null;
          updateData.venue = "";
        } else {
          updateData.locationId = locationId;
          updateData.venue = dto.venue;
        }
      }

      // updateData.isApproved = false
      // TODO: handle after update

      await this.updateOne({ id: eventId }, updateData);

      return eventId;
    } catch (error) {
      throw new Error(`Failed to find user: ${error.message}`);
    }
  }

  async getEventOrganizer(eventId: number): Promise<string | null> {
    try {
      const event = await this.prisma.events.findUnique({
        where: { id: eventId },
        select: { organizerId: true },
      });

      if (!event) {
        throw new Error('Event not found');
      }

      return event.organizerId;
    } catch (error) {
      throw new Error(`Failed to get event organizer: ${error.message}`);
    }
  }

  async getMember(eventId: number, userEmail: string): Promise<any | null> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { email: userEmail },
      });

      if (!user) {
        throw new Error(`User with email ${userEmail} not found`);
      }

      const member = await this.prisma.eventUserRelationship.findUnique({
        where: {
          eventId_userId: {
            eventId,
            userId: user.id,
          },
        },
      });

      return member;
    } catch (error) {
      throw new Error(`Failed to get member: ${error.message}`);
    }
  }

  async hasPermissionToUpdateEvent(eventId: number, userEmail: string): Promise<Result<boolean, Error>> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { email: userEmail },
      });
      if (!user) {
        throw new Error(`User with email ${userEmail} not found`);
      }

      const event = await this.findOneById(eventId);
      if (!event) {
        throw new Error(`Event with ID ${eventId} not found`);
      }

      if (event?.organizerId === userEmail) {
        return Ok(true);
      }

      const member = await this.getMember(eventId, userEmail);
      if (!member || member.isDeleted) {
        return Ok(false);
      }

      const role = await this.prisma.eventRole.findUnique({
        where: { id: member.role },
      });
      if (!role) {
        return Ok(false);
      }

      return Ok(role.isEdited === true);
    } catch (error) {
      throw new Error(`Failed to check permission: ${error.message}`);
    }
  }

  async updateEventCategory(eventId: number, categoryIds: number[]): Promise<Result<any, Error>> {
    let parsedCategoryIds: number[];

    if (typeof categoryIds === 'string') {
      try {
        parsedCategoryIds = JSON.parse(categoryIds);
      } catch (error) {
        return Err(new Error('Invalid categoryIds format'));
      }
    } else {
      parsedCategoryIds = categoryIds;
    }

    try {
      // Remove all existing event categories
      await this.prisma.eventCategories.deleteMany({
        where: { eventId: eventId >> 0 },
      });
      // If new categories are provided, add them
      if (parsedCategoryIds.length > 0) {
        const categories = await this.prisma.categories.findMany({
          where: {
            id: { in: parsedCategoryIds }
          }
        });
        if (categories.length === 0) {
          return Err(new Error('Categories not found'));
        }
        const eventCategory = categories.map(category => ({
          eventId: eventId >> 0,
          categoryId: category.id
        }));
        await this.prisma.eventCategories.createMany({
          data: eventCategory
        });
        return Ok(eventCategory);
      }
      return Ok([]);
    } catch (error) {
      return Err(new Error('Failed to update event category'));
    }
  }
}
