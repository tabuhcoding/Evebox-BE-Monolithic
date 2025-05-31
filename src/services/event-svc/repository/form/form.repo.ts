import { BaseRepository } from "src/shared/repo/base.repository";
import { Prisma } from "@prisma/client";
import { Result } from "oxide.ts";

import { CreateFormDto } from "../../modules/form/commands/createForm/createForm.dto";
import { UpdateFormDto } from "../../modules/form/commands/updateForm/updateForm.dto";


export type Form = Prisma.FormGetPayload<{
  include: {
    FormInput: true;
  };
}>;

export interface FormRepository extends BaseRepository<Form, Prisma.FormDelegate> {
  checkAuthor(id: number, userId: string): Promise<Result<boolean, Error>>;

  /* Create Form */
  createForm(dto: CreateFormDto, userEmail: string): Promise<Result<string, Error>>;

  /* Update Form */
  updateForm(dto: UpdateFormDto & { id: number }): Promise<Result<number, Error>>;

  /* Delete Form */
  deleteForm(id: number): Promise<Result<number, Error>>;
}