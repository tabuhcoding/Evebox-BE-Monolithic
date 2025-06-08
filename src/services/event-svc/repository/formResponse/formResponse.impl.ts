import { Injectable } from "@nestjs/common";
import { FormResponseRepository, FormResponse } from "src/services/event-svc/repository/formResponse/formResponse.repo";
import { PrismaService } from "src/infrastructure/database/prisma/prisma.service";
import { BaseRepository } from "src/shared/repo/base.repository";
import { Prisma } from "@prisma/client";

@Injectable()
export class FormResponseRepositoryImpl
  extends BaseRepository<FormResponse, Prisma.FormResponseDelegate>
  implements FormResponseRepository {
  
  constructor(protected readonly prisma: PrismaService) {
    super(prisma.formResponse, prisma);
  }
}