import { Injectable } from "@nestjs/common";
import { FormResponseRepository, FormResponse } from "src/services/event-svc/repository/formResponse/formResponse.repo";
import { PrismaEventService } from "../../database/prisma-event/prisma.service";
import { BaseEventRepository } from '../base.repository';
import { Prisma } from "prisma/client-event";
import { CreateFormResponseDto } from "../../modules/formResponse/commands/createFormResponse/createFormResponse.dto";
import { Err } from "oxide.ts";

@Injectable()
export class FormResponseRepositoryImpl
  extends BaseEventRepository<FormResponse, Prisma.FormResponseDelegate>
  implements FormResponseRepository {

  constructor(protected readonly prisma: PrismaEventService) {
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

  async createFormResponse(dto: CreateFormResponseDto, userId: string): Promise<FormResponse> {
    try {
      const formResponse = await this.repo.create({
        data: {
          userId: userId,
          formId: dto.formId,
          showingId: dto.showingId,
          FormAnswer: {
            create: dto.answers.map((answer) => ({
              formInputId: answer.formInputId,
              value: answer.value,
            })),
          },
        },
        include: {
          FormAnswer: {
            include: {
              FormInput: {
                select: {
                  fieldName: true,
                  options: true,
                }
              }
            }
          }
        },
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
      return null;
    }
  }
}