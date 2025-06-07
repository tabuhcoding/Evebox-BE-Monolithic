import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/infrastructure/database/prisma/prisma.service";
import { BaseRepository } from "src/shared/repo/base.repository";
import { EventUserRelationship, Prisma } from "@prisma/client";
import { EventUserRelationshipRepository } from "./eventUserRelationship.repo";
import { Result } from "oxide.ts";

@Injectable()
export class EventUserRelationshipRepositoryImpl
  extends BaseRepository<EventUserRelationship, Prisma.EventUserRelationshipDelegate>
  implements EventUserRelationshipRepository {
  constructor(protected readonly prisma: PrismaService) {
    super(prisma.eventUserRelationship, prisma);
  }

}