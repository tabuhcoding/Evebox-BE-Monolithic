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

  async getFormResponseById(id: number): Promise<FormResponse | null> {
    try {
      const formResponse = await this.findOneById(id, {
        FormAnswer: {
          select: {
            value: true,
            FormInput: {
              select: {
                fieldName: true,
                options: true,
              }
            }
          }
        }
      });

      if (!formResponse) {
        return null;
      }

      // Format the FormResponse to match the expected structure
      const formattedResponse: FormResponse = {
        ...formResponse,
        FormAnswer: formResponse.FormAnswer.map(answer => ({
          value: answer.value,
          FormInput: {
            fieldName: answer.FormInput.fieldName,
            options: answer.FormInput.options
          }
        }))
      };
      
      return formattedResponse;
    } catch (error) {
      console.error("🚀 ~ FormResponseRepositoryImpl ~ getFormResponseById ~ error:", error);
      return null;
    }
  }
}