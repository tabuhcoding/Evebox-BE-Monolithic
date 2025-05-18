import { Injectable } from '@nestjs/common';
import { Events, EventsRepository } from './events.repo';
import { PrismaService } from 'src/infrastructure/database/prisma/prisma.service';
import { BaseRepository } from 'src/shared/repo/base.repository';
import { Prisma } from '@prisma/client';

@Injectable()
export class EventsRepositoryImpl
  extends BaseRepository<Events, Prisma.EventsDelegate>
  implements EventsRepository
{
  constructor(protected readonly prisma: PrismaService) {
    super(prisma.events, prisma);
  }
}
