import { Injectable } from "@nestjs/common";
import { FormInputRepository, FormInput } from "./formInput.repo";
import { PrismaEventService } from "../../database/prisma-event/prisma.service";
import { BaseEventRepository } from '../base.repository';
import { Prisma } from "prisma/client-event";

@Injectable() 
export class FormInputRepositoryImpl 
  extends BaseEventRepository<FormInput, Prisma.FormInputDelegate>
  implements FormInputRepository {
    
  constructor(protected readonly prisma: PrismaEventService) {
    super(prisma.formInput, prisma);
  }

  
}