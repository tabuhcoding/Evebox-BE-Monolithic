import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/infrastructure/database/prisma/prisma.service";
import { BaseRepository } from "src/shared/repo/base.repository";
import { EventRole, Prisma } from "@prisma/client";
import { EventRoleRepository } from "./eventRole.repo";
import { Result } from "oxide.ts";

@Injectable()
export class EventRoleRepositoryImpl
  extends BaseRepository<EventRole, Prisma.EventRoleDelegate>
  implements EventRoleRepository {
  constructor(protected readonly prisma: PrismaService) {
    super(prisma.eventRole, prisma);
  }

}