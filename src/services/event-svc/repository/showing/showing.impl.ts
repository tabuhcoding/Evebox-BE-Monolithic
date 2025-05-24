import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/infrastructure/database/prisma/prisma.service";
import { BaseRepository } from "src/shared/repo/base.repository";
import { Showing, ShowingRepository } from "./showing.repo";
import { Prisma } from "@prisma/client";

@Injectable()
export class ShowingRepositoryImpl
  extends BaseRepository<Showing, Prisma.ShowingDelegate>
  implements ShowingRepository
{
  constructor(protected readonly prisma: PrismaService) {
    super(prisma.showing, prisma);
  }
}