import { Inject, Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";

import { PrismaService } from "src/infrastructure/database/prisma/prisma.service";
import { BaseRepository } from "src/shared/repo/base.repository";
import { EventsRepository } from "../events/events.repo";
import { Showing, ShowingRepository } from "./showing.repo";
import { CreateShowingDto } from "../../modules/showing/command/createShowing/createShowing.dto";
import { UpdateShowingDto } from "../../modules/showing/command/updateShowing/updateShowing.dto";
import { Ok, Result, Err } from "oxide.ts";

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

      const hasPermisison = await this.eventsRepository.hasPermissionToManageEvent(showing?.eventId, userId);
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
}