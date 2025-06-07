import { BaseRepository } from "src/shared/repo/base.repository";
import { Prisma } from "@prisma/client";

export type FormResponse = Prisma.FormResponseGetPayload<{
}>;

export interface FormResponseRepository extends BaseRepository<FormResponse, Prisma.FormResponseDelegate> {
  // /* Create Form Response */
  // createFormResponse(formId: number, userEmail: string, data: Record<string, any>): Promise<FormResponse>;

  // /* Get Form Response by ID */
  // getFormResponseById(id: number): Promise<FormResponse | null>;

  // /* Get All Form Responses for a Form */
  // getAllFormResponsesByFormId(formId: number): Promise<FormResponse[]>;

  // /* Delete Form Response */
  // deleteFormResponse(id: number): Promise<boolean>;
}