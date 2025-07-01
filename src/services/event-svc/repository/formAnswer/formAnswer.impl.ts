import { Injectable } from "@nestjs/common";
import { FormAnswerRepository, FormAnswer } from "./formAnswer.repo";
import { PrismaEventService } from "../../database/prisma-event/prisma.service";
import { BaseEventRepository } from '../base.repository';
import { Prisma } from "prisma/client-event";

@Injectable() 
export class FormAnswerRepositoryImpl 
  extends BaseEventRepository<FormAnswer, Prisma.FormAnswerDelegate>
  implements FormAnswerRepository {
    
  constructor(protected readonly prisma: PrismaEventService) {
    super(prisma.formAnswer, prisma);
  }

  
}