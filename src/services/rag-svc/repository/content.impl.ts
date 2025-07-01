import { Injectable } from "@nestjs/common";
import { Content, Prisma } from "prisma/client-ai";
import { BaseAIRepository } from "./base.repository";
import { ContentRepository } from "./content.repo";
import { PrismaAIService } from "../database/prisma-ai/prisma.service";

@Injectable()
export class ContentRepositoryImpl 
extends BaseAIRepository<Content, Prisma.ContentDelegate>
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