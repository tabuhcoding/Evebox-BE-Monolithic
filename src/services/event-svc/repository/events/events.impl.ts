import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/infrastructure/database/prisma/prisma.service';
import { BaseRepository } from 'src/shared/repo/base.repository';
import { Prisma } from '@prisma/client';
import { Result, Ok, Err } from 'oxide.ts';

import { Events, EventsRepository } from './events.repo';
import { ShowingRepository } from '../showing/showing.repo';
import { EventUserRelationshipRepository } from '../eventUserRelationship/eventUserRelationship.repo';
import { CreateEventDto } from '../../modules/event/commands/createEvent/createEvent.dto';
import { UpdateEventDto } from '../../modules/event/commands/updateEvent/updateEvent.dto';
import { UpdateEventAdminDto } from '../../modules/event/commands/UpdateEventAdmin/updateEventAdmin.dto';
import { EventOrgFrontDisplayDto } from '../../modules/event/queries/getEventOfOrg/getEventOfOrg-response.dto';
import { EventOrgDetailResponseDto } from '../../modules/event/queries/getEventOfOrgDetail/getEventOfOrgDetail-response.dto';
import { GetUserService } from 'src/services/auth-svc/modules/user/queries/get-user/get-user.service';
import { EVENT_ROLE } from '../../modules/event/domain/eventRole';

@Injectable()
export class EventsRepositoryImpl
  extends BaseRepository<Events, Prisma.EventsDelegate>
  implements EventsRepository {
  constructor(
    @Inject(forwardRef(() => 'EventUserRelationshipRepository'))
    private readonly eventUserRelaRepo: EventUserRelationshipRepository,
    @Inject('ShowingRepository') private readonly showingRepository: ShowingRepository,
    protected readonly prisma: PrismaService,
    private readonly getUserService: GetUserService,
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
      if (!updatedEvent) {
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

  async hasPermissionToManageEvent(eventId: number, userEmail: string, permission: string): Promise<Result<boolean, Error>> {
    try {
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

      return Ok(role[permission] === true);
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

  async updateEventFields(dto: UpdateEventAdminDto, eventId: number): Promise<any | null> {
    const updateData: any = {};
    if (dto.isSpecial) updateData.isSpecial = dto.isSpecial;
    if (dto.isOnlyOnEve) updateData.isOnlyOnEve = dto.isOnlyOnEve;
    if (dto.isApproved) {
      updateData.isApproved = Boolean(dto.isApproved);
    }
    else updateData.isApproved = false;

    try {
      return await this.prisma.events.update({
        where: { id: eventId },
        data: updateData,
      });
    } catch (error) {
      console.error("Prisma update error:", error);

      return null;
    }
  }

  async findWithFilters(filters: any): Promise<Result<any[], Error>> {
    try {
      const where = this.buildWhereClause(filters);
      const page = Number(filters.page ?? 1);
      const limit = Number(filters.limit ?? 10);

      const data = await this.prisma.events.findMany({
        where: {
          ...where,
          ...(filters.categoryId && {
            EventCategories: {
              some: { categoryId: Number(filters.categoryId) }
            }
          })
        },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          title: true,
          venue: true,
          imgLogoUrl: true,
          imgPosterUrl: true,
          deleteAt: true,
          locations: {
            select: {
              street: true,
              ward: true,
              districts: {
                select: {
                  name: true,
                  province: { select: { name: true } }
                }
              }
            }
          },
          isApproved: true,
          createdAt: true,
          isSpecial: true,
          isOnlyOnEve: true,
          isOnline: true,
        },
        orderBy: { createdAt: 'desc' }
      });

      return Ok(data); // ✅ wrap in Ok
    } catch (error) {
      return Err(new Error('Failed to fetch events')); // ✅ return error clearly
    }
  }

  async getShowingsByEventId(eventId: number): Promise<{ startTime: Date }[]> {
    return this.prisma.showing.findMany({
      where: { eventId },
      select: { startTime: true },
    });
  }

  private buildWhereClause(filters: any): any {
    const where: any = {};
    if ('isApproved' in filters) where.isApproved = filters.isApproved === 'true';
    if ('isDeleted' in filters) where.deleteAt = filters.isDeleted === 'true' ? { not: null } : null;
    if ('createdFrom' in filters) where.createdAt = { ...where.createdAt, gte: new Date(filters.createdFrom) };
    if ('createdTo' in filters) where.createdAt = { ...where.createdAt, lte: new Date(filters.createdTo) };
    return where;
  }
  async getSpecialEventsWithFilters(filters: any): Promise<any[]> {
    const where = this.buildWhereClause2(filters);
    const page = Number(filters.page ?? 1);
    const limit = Number(filters.limit ?? 10);

    return this.prisma.events.findMany({
      where: {
        ...where,
        ...(filters.categoryId && {
          EventCategories: {
            some: {
              categoryId: Number(filters.categoryId),
              isSpecial: true,
            },
          },
        }),
      },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        title: true,
        imgPosterUrl: true,
        isSpecial: true,
        isOnlyOnEve: true,
        EventCategories: {
          select: {
            isSpecial: true,
            Categories: {
              select: { id: true, name: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async countSpecialEvents(filters: any): Promise<number> {
    const where = this.buildWhereClause2(filters);
    return this.prisma.events.count({ where });
  }

  private buildWhereClause2(filters: any) {
    const where: any = {};

    if (filters.isSpecial !== undefined) {
      where.isSpecial = filters.isSpecial === 'true';
    }
    if (filters.isOnlyOnEve !== undefined) {
      where.isOnlyOnEve = filters.isOnlyOnEve === 'true';
    }
    if (filters.search) {
      const keyword = filters.search.trim();
      if (!isNaN(Number(keyword))) {
        where.OR = [
          { id: Number(keyword) },
          { title: { contains: keyword, mode: 'insensitive' } },
        ];
      } else {
        where.title = { contains: keyword, mode: 'insensitive' };
      }
    }

    return where;
  }

  async getEventOfOrg(email: string): Promise<Result<(EventOrgFrontDisplayDto & { role: number; })[], Error>> {
    try {
      const user = await this.getUserService.execute(email);

      if (user.isErr()) {
        return Err(new Error(user.unwrapErr().message));
      }

      const userId = user.unwrap().id;

      // 1. Get events where user is the ORGANIZER (role = 2)
      const organizerEvents = await this.findMany({
        organizerId: email,
        deleteAt: null,
      });

      // 2. Get events from UserEventRelationship
      const relatedEvents = await this.eventUserRelaRepo.findMany({
        userId
      });

      const results: (EventOrgFrontDisplayDto & { role: number })[] = [];

      // Add organizer events
      for (const event of organizerEvents) {
        const showings = await this.showingRepository.findMany({
          eventId: event.id,
        });

        const { street, ward, districts } = event.locations ?? {};
        const districtName = districts?.name || '';
        const provinceName = districts?.province?.name || '';
        const locationsString = `${street || ''}, ${ward || ''}, ${districtName}, ${provinceName}`;
        const startTime = await this.caculateEventsStartDate(showings);

        results.push({
          ...event,
          startDate: startTime,
          locationString: locationsString,
          role: 2, // Organizer role
        });
      }

      // Add related events (from user-event relationships)
      for (const rel of relatedEvents) {
        const eventId = rel.eventId;

        const event = await this.findOneById(Number(eventId));

        if (results.some(e => e.id === event.id)) continue;

        const showings = await this.showingRepository.findMany({
          eventId,
        });

        const { street, ward, districts } = event.locations ?? {};
        const districtName = districts?.name || '';
        const provinceName = districts?.province?.name || '';
        const locationsArray = [street, ward, districtName, provinceName].filter(Boolean);

        const locationsString = locationsArray.join(', ');
        const startTime = await this.caculateEventsStartDate(showings);

        results.push({
          ...event,
          startDate: startTime,
          locationString: locationsString,
          role: rel.role, // Other role
        });
      }

      return Ok(results);
    } catch (error) {
      return Err(new Error('Failed to retrieve events of org'));
    }
  }

  async caculateEventsStartDate(showings: any[]) {
    let startTime = new Date("9999-12-31T23:59:59.999Z");
    const nowDate = new Date();
    for (const showing of showings) {
      if (new Date(showing.startTime) > nowDate && new Date(showing.startTime) < startTime) {
        startTime = new Date(showing.startTime);
        continue;
      }
      if (new Date(showing.startTime) < startTime) {
        startTime = new Date(showing.startTime);
      }
    }
    return startTime;
  }

  async getEventOfOrgDetail(eventId: number): Promise<Result<EventOrgDetailResponseDto, Error>> {
    try {
      const event = await this.prisma.events.findUnique({
        where: {
          id: Number(eventId),
        }, 
        select: {
          id: true,
          title: true,
          description: true,
          imgLogoUrl: true,
          imgPosterUrl: true,
          createdAt: true,
          isOnline: true,
          locations: {
            select: {
              id: true,
              street: true,
              ward: true,
              districts: {
                select:{
                  id: true,
                  name: true,
                  province: {
                    select: {
                      id: true,
                      name: true
                    }
                  }
                }
              }
            }
          },
          venue: true,
          isApproved: true,
          orgDescription: true,
          orgName: true,
          deleteAt: true,
          EventCategories: {
            select: {
              Categories: {
                select: {
                  id: true,
                  name: true
                }
              }
            }
          },
          Showing: {
            select: {
                id: true,
                isFree: true,
                startTime: true,
                endTime: true,
            }
          }
        }
      });

      if (!event) {
        return Err(new Error('No event found'));
      }

      if (event.deleteAt !== null) {
        return Err(new Error(`Event ${eventId} has been deleted`));
      }
      
      const { street, ward, districts } = event.locations ?? {};
      const districtName = districts?.name || '';
      const provinceName = districts?.province?.name || '';
      const locationsArray = [street, ward, districtName, provinceName].filter(Boolean);
      
      const locationsString = locationsArray.join(', ');
      const eventDetail: EventOrgDetailResponseDto = {
        ...event,
        locationsString,
        EventCategories: event.EventCategories.map(category => ({
          id: category.Categories.id,
          name: category.Categories.name
        }))
      };
      return Ok(eventDetail);
    } catch (error) {
      return Err(new Error('Failed to retrieve detail of event of org'));
    }
  }

  async findEventsByOrganizerEmail(email: string) {
    return this.prisma.events.findMany({
      where: { organizerId: email },
      select: {
        locationId: true,
        venue: true,
      },
    });
  }
}
