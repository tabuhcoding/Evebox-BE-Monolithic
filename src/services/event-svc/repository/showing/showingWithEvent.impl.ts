import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";

import { PrismaService } from "src/infrastructure/database/prisma/prisma.service";
import { BaseRepository } from "src/shared/repo/base.repository";
import { ShowingWithEvent, ShowingWithEventRepository } from "./showingWithEvent.repo";

@Injectable()
export class ShowingWithEventRepositoryImpl
  extends BaseRepository<ShowingWithEvent, Prisma.ShowingDelegate>
  implements ShowingWithEventRepository
{
  constructor(
    protected readonly prisma: PrismaService
  ) {
    super(prisma.showing, prisma);
  }

}