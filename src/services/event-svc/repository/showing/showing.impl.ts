import { Inject, Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";

import { PrismaService } from "src/infrastructure/database/prisma/prisma.service";
import { BaseRepository } from "src/shared/repo/base.repository";
import { EventsRepository } from "../events/events.repo";
import { EVENT_ROLE } from "../../modules/event/domain/eventRole";
import { Showing, ShowingRepository } from "./showing.repo";
import { CreateShowingDto } from "../../modules/showing/command/createShowing/createShowing.dto";
import { UpdateShowingDto } from "../../modules/showing/command/updateShowing/updateShowing.dto";
import { Ok, Result, Err } from "oxide.ts";
import { ShowingDataDto } from "../../modules/showing/queries/getShowingsByAdmin/getShowings-response.dto";

@Injectable()
export class ShowingRepositoryImpl
  extends BaseRepository<Showing, Prisma.ShowingDelegate>
  implements ShowingRepository
{
  constructor(
    @Inject('EventsRepository') private readonly eventsRepository: EventsRepository,
    protected readonly prisma: PrismaService
  ) {
    super(prisma.showing, prisma);
  }

  async createShowing(dto: CreateShowingDto, eventId: number): Promise<Result<[string, boolean], Error>> {
    try {
      const showingId = await this.insertOne({
        startTime: dto.startTime,
        endTime: dto.endTime,
        eventId: eventId >> 0,
        isFree: false,
        isSalable: false,
        isPresale: false,
        seatMapId: 0,
        isEnabledQueueWaiting: false,
        showAllSeats: false,
      });

      if (!showingId || typeof showingId !== 'string' || showingId.trim() === '') {
        return Err(new Error('Failed to create showing'));
      }

      const event = await this.eventsRepository.findOneById(eventId);

      return Ok([showingId, event.isApproved]);
    } catch (error) {
      console.error(`Failed to create showing: ${error.message}`);
      return Err(new Error(`Failed to create showing: ${error.message}`));
    }
  }

  async updateShowing(dto: UpdateShowingDto, id: string): Promise<Result<[string, boolean], Error>> {
    try {
      const showing = await this.findOneById(id);

      const updateData: any = {};
      if (dto.startTime) updateData.startTime = dto.startTime;
      if (dto.endTime) updateData.endTime = dto.endTime;

      const startTimeValid = dto.startTime || showing.startTime;
      const endTimeValid = dto.endTime || showing.endTime;
      if (startTimeValid && endTimeValid && new Date(startTimeValid) > new Date(endTimeValid)) {
        return Err(new Error('Showing startTime must be before endTime'));
      }

      const updatedShowing = await this.updateAndFindOneById(id, updateData);
      if (!updatedShowing) {
        return Err(new Error('Failed to update showing'));
      }

      const event = await this.eventsRepository.findOneById(Number(showing.eventId));

      return Ok([updatedShowing.id, event.isApproved]);
    } catch (error) {
      console.error(`Failed to update showing: ${error.message}`);
      return Err(new Error(`Failed to update showing: ${error.message}`));
    }
  }

  async checkAuthor(id: string, userId: string): Promise<Result<boolean, Error>> {
    try {
      const showing = await this.findOneById(id);

      const hasPermisison = await this.eventsRepository.hasPermissionToManageEvent(showing?.eventId, userId, EVENT_ROLE.IS_EDITED);
      if (hasPermisison.isErr()) {
        return Err(new Error('Failed to check permission'));
      }

      return Ok(hasPermisison.unwrap() === true);
    } catch (error) {
      console.error(`Failed to check author: ${error.message}`);
      return Err(new Error(`Failed to check author: ${error.message}`));
    }
  }

  async deleteShowing(id: string): Promise<Result<string, Error>> {
    try {
      const showing = await this.findOneById(id);

      if (showing.deleteAt === null) {
        await this.updateOneById(id, {
          deleteAt: new Date(),
        });

        return Ok(showing.id);
      }

      return Err(new Error('Showing not found or could not be deleted'));
    } catch (error) {
      console.error(`Failed to delete showing: ${error.message}`);
      return Err(new Error(`Failed to delete showing: ${error.message}`));
    }
  }

   async findAdminShowingById(showingId: string) {
    return this.prisma.showing.findUnique({
      where: { id: showingId, deleteAt: null },
      select: {
        id: true,
        eventId: true,
        isFree: true,
        isSalable: true,
        isPresale: true,
        seatMapId: true,
        startTime: true,
        endTime: true,
        isEnabledQueueWaiting: true,
        showAllSeats: true,
        Events: { select: { id: true, title: true } },
        TicketType: {
          select: {
            id: true,
            name: true,
            description: true,
            color: true,
            isFree: true,
            price: true,
            originalPrice: true,
            maxQtyPerOrder: true,
            minQtyPerOrder: true,
            startTime: true,
            endTime: true,
            position: true,
            imageUrl: true,
            isHidden: true,
            quantity: true,
          },
        },
      },
    });
  }

  async getShowingStatusData(showingId: string) {
    return this.prisma.showing.findUnique({
      where: { id: showingId },
      select: {
        TicketType: { select: { id: true } },
        seatMapId: true,
      },
    });
  }

   async findWithFilters(filters: any): Promise<ShowingDataDto[]> {
    const where = this.buildWhereClause(filters);
    const page = Number(filters.page ?? 1);
    const limit = Number(filters.limit ?? 10);

    const showings = await this.prisma.showing.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        startTime: true,
        endTime: true,
        seatMapId: true,
        Events: {
          select: { id: true, title: true },
        },
        TicketType: {
          select: { id: true },
        },
      },
      orderBy: {
        startTime: 'asc',
      },
    });

    return showings.map((showing) => ({
      id: showing.id,
      startTime: showing.startTime,
      endTime: showing.endTime,
      seatmapId: showing.seatMapId,
      eventId: showing.Events.id,
      eventTitle: showing.Events.title,
      event: {
        id: showing.Events.id,
        title: showing.Events.title,
      },
      ticketTypes: showing.TicketType,
    }));
  }

  async count(filters: any): Promise<number> {
    const where = this.buildWhereClause(filters);
    return this.prisma.showing.count({ where });
  }

  private buildWhereClause(filters: any) {
    const where: any = {};

    if (filters.startTime || filters.endTime) {
      where.startTime = {};
      where.endTime = {};

      if (filters.startTime) {
        where.startTime.gte = new Date(filters.startTime);
      }

      if (filters.endTime) {
        where.endTime.lte = new Date(filters.endTime);
      }
    }

    if (filters.search) {
      const keyword = filters.search.trim();
      const isId = !isNaN(Number(keyword));
      where.Events = {
        ...(isId
          ? { id: Number(keyword) }
          : { title: { contains: keyword, mode: 'insensitive' } }),
      };
    }

    return where;
  }

 async getBasicShowingDetail(showingId: string, ticketTypeId: string) {
  return this.prisma.showing.findUnique({
    where: { id: showingId },
    select: {
      id: true,
      eventId: true,
      startTime: true,
      endTime: true,
      seatMapId: true,
      Events: {
        select: {
          id: true,
          title: true,
        }
      },
      TicketType: {
        where: { id: ticketTypeId },
        select: {
          id: true,
          name: true,
          description: true,
          price: true,
          maxQtyPerOrder: true,
          minQtyPerOrder: true,
          quantity: true,
          imageUrl: true,
          startTime: true,
          endTime: true
        }
      }
    }
  });
}

async findShowingsByOrgAndEvent(orgId: string, eventId: number) {
    return this.prisma.showing.findMany({
      where: {
        deleteAt: null,
        eventId,
        Events: {
          organizerId: orgId,
          isApproved: true,
          deleteAt: null,
        },
      },
      select: {
        id: true,
        startTime: true,
        endTime: true,
        TicketType: true
      },
    });
  }
}