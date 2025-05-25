import { Injectable } from '@nestjs/common';
import { Events, EventsRepository } from './events.repo';
import { PrismaService } from 'src/infrastructure/database/prisma/prisma.service';
import { BaseRepository } from 'src/shared/repo/base.repository';
import { Prisma } from '@prisma/client';
import { UpdateEventAdminDto } from '../../modules/event/commands/calculateShowingStatus/UpdateEventAdmin/updateEventAdmin.dto';
import { error } from 'console';

@Injectable()
export class EventsRepositoryImpl
  extends BaseRepository<Events, Prisma.EventsDelegate>
  implements EventsRepository
{
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
}
