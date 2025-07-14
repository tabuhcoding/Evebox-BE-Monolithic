import { BaseEventRepository } from '../base.repository';
import { Prisma } from "prisma/client-event";

import { CreateFormResponseDto } from "../../modules/formResponse/commands/createFormResponse/createFormResponse.dto";

export type FormResponse = Prisma.FormResponseGetPayload<{
  include: {
    FormAnswer: {
      select: {
        value: true,
        formInputId: true,
        FormInput: {
          select: {
            fieldName: true,
            options: true,
          }
        }
      }
    }
  }
}>;

export interface FormResponseRepository extends BaseEventRepository<FormResponse, Prisma.FormResponseDelegate> {
  // /* Create Form Response */
  createFormResponse(dto: CreateFormResponseDto, userId: string): Promise<FormResponse>;

  // /* Get Form Response by ID */
  getFormResponseById(id: number): Promise<FormResponse | null>;

  cloneFormResponse(id: number, userId: string, orderId: number): Promise<number>;

  // /* Get All Form Responses for a Form */
  // getAllFormResponsesByFormId(formId: number): Promise<FormResponse[]>;

  // /* Delete Form Response */
  // deleteFormResponse(id: number): Promise<boolean>;
}