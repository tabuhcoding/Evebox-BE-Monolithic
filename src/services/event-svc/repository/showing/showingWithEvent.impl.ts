import { Injectable } from "@nestjs/common";
import { Prisma } from "prisma/client-event";

import { PrismaEventService } from "../../database/prisma-event/prisma.service";
import { BaseEventRepository } from '../base.repository';
import { ShowingWithEvent, ShowingWithEventRepository } from "./showingWithEvent.repo";

@Injectable()
export class ShowingWithEventRepositoryImpl
  extends BaseEventRepository<ShowingWithEvent, Prisma.ShowingDelegate>
  implements ShowingWithEventRepository
{
  constructor(
    protected readonly prisma: PrismaEventService
  ) {
    super(prisma.showing, prisma);
  }

}