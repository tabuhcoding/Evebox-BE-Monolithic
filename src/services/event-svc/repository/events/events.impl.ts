import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/infrastructure/database/prisma/prisma.service';
import { BaseRepository } from 'src/shared/repo/base.repository';
import { Prisma } from '@prisma/client';
import { Result, Ok, Err } from 'oxide.ts';

import { Events, EventsRepository } from './events.repo';
import { Email } from 'src/services/auth-svc/modules/user/domain/value-objects/user/email.vo';
import { CreateEventDto } from '../../modules/event/commands/createEvent/createEvent.dto';
import { UpdateEventDto } from '../../modules/event/commands/updateEvent/updateEvent.dto';

@Injectable()
export class EventsRepositoryImpl
  extends BaseRepository<Events, Prisma.EventsDelegate>
  implements EventsRepository {
  constructor(
    protected readonly prisma: PrismaService
  ) {
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

  /* Create Event */
  async createEvent(dto: CreateEventDto, email: string, locationId?: number): Promise<number> {
    try {
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
          userId: email,
          email: email,
          role: 2, // Assuming 2 is the role for organizer
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

  /* Update Event */
  async updateEvent(dto: UpdateEventDto, eventId: number, locationId?: number): Promise<[number, boolean]> {
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

      const updatedEvent = await this.updateAndFindOneById(eventId, updateData);
      if( !updatedEvent) {
        throw new Error('Failed to update event');
      }

      return [updatedEvent.id, updatedEvent.isApproved];
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
      const member = await this.prisma.eventUserRelationship.findUnique({
        where: {
          eventId_userId: {
            eventId,
            userId: userEmail,
          },
        },
      });

      return member;
    } catch (error) {
      throw new Error(`Failed to get member: ${error.message}`);
    }
  }

  async hasPermissionToManageEvent(eventId: number, userEmail: string): Promise<Result<boolean, Error>> {
    try {
      const event = await this.findOneById(eventId);
      console.log("🚀 ~ hasPermissionToManageEvent ~ event:", event)
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

  async deleteEvent(id: number): Promise<number> {
    try {
      const event = await this.findOneById(id);

      if (event && event.deleteAt === null) {
        await this.updateOneById(id, {
          deleteAt: new Date(),
        });

        return event.id;
      }

      throw new Error('Event not found or could not be deleted');
    } catch (error) {
      throw new Error(`Failed to check permission: ${error.message}`);
    }
  }
}
