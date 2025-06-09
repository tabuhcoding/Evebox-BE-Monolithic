import { Injectable } from "@nestjs/common";
import { FormInputRepository, FormInput } from "./formInput.repo";
import { PrismaService } from "src/infrastructure/database/prisma/prisma.service";
import { BaseRepository } from "src/shared/repo/base.repository";
import { Prisma } from "@prisma/client";

@Injectable() 
export class FormInputRepositoryImpl 
  extends BaseRepository<FormInput, Prisma.FormInputDelegate>
  implements FormInputRepository {
    
  constructor(protected readonly prisma: PrismaService) {
    super(prisma.formInput, prisma);
  }

  
}