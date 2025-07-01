import { Injectable } from "@nestjs/common";
import { PrismaEventService } from "../../database/prisma-event/prisma.service";
import { BaseEventRepository } from '../base.repository';
import { EventUserRelationship, Prisma } from "prisma/client-event";
import { EventUserRelationshipRepository } from "./eventUserRelationship.repo";

@Injectable()
export class EventUserRelationshipRepositoryImpl
  extends BaseEventRepository<EventUserRelationship, Prisma.EventUserRelationshipDelegate>
  implements EventUserRelationshipRepository {
  constructor(protected readonly prisma: PrismaEventService) {
    super(prisma.eventUserRelationship, prisma);
  }

}