import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/infrastructure/database/prisma/prisma.service";
import { BaseRepository } from "src/shared/repo/base.repository";
import { Form, FormRepository } from "./form.repo";
import { Prisma } from "@prisma/client";

@Injectable()
export class FormRepositoryImpl
  extends BaseRepository<Form, Prisma.FormDelegate>
  implements FormRepository
{
  constructor(protected readonly prisma: PrismaService) {
    super(prisma.form, prisma);
  }

}