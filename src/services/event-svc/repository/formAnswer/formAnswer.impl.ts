import { Injectable } from "@nestjs/common";
import { FormAnswerRepository, FormAnswer } from "./formAnswer.repo";
import { PrismaService } from "src/infrastructure/database/prisma/prisma.service";
import { BaseRepository } from "src/shared/repo/base.repository";
import { Prisma } from "@prisma/client";

@Injectable() 
export class FormAnswerRepositoryImpl 
  extends BaseRepository<FormAnswer, Prisma.FormAnswerDelegate>
  implements FormAnswerRepository {
    
  constructor(protected readonly prisma: PrismaService) {
    super(prisma.formAnswer, prisma);
  }

  
}