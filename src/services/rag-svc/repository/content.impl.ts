import { Injectable } from "@nestjs/common";
import { Content, Prisma } from "prisma/client-ai";
import { BaseRepository } from "./base.repository";
import { ContentRepository } from "./content.repo";
import { PrismaAIService } from "../database/prisma-ai/prisma.service";

@Injectable()
export class ContentRepositoryImpl 
extends BaseRepository<Content, Prisma.ContentDelegate>
implements ContentRepository {
  constructor(protected readonly prisma: PrismaAIService) {
    super(prisma.content, prisma);
  }

  async findOneWithChild(id: number): Promise<any> {
    return this.repo.findUnique({
      where: { id },
      select: {
        id: true,
        context: true,
        message: true,
        rootId: true,
        Child: {
          select: { id: true }
        }
      }
    }) as Promise<any>;
  }
}