import { Injectable } from "@nestjs/common";
import { PrismaEventService } from "../../database/prisma-event/prisma.service";
import { BaseEventRepository } from '../base.repository';
import { EventRole, Prisma } from "prisma/client-event";
import { EventRoleRepository } from "./eventRole.repo";
import { Result } from "oxide.ts";

@Injectable()
export class EventRoleRepositoryImpl
  extends BaseEventRepository<EventRole, Prisma.EventRoleDelegate>
  implements EventRoleRepository {
  constructor(protected readonly prisma: PrismaEventService) {
    super(prisma.eventRole, prisma);
  }

}