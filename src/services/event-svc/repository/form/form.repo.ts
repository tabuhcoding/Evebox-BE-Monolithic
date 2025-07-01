import { BaseEventRepository } from '../base.repository';
import { Prisma } from "prisma/client-event";
import { Result } from "oxide.ts";

import { CreateFormDto } from "../../modules/form/commands/createForm/createForm.dto";
import { UpdateFormDto } from "../../modules/form/commands/updateForm/updateForm.dto";
import { ConnectFormDto } from "../../modules/form/commands/connectFormToShowing/connectFormToShowing.dto";
import { ConnectFormResponseData } from "../../modules/form/commands/connectFormToShowing/connectFormToShowing-response.dto";
import { BasicFormDto } from '../../modules/form/queries/getAllForms/getAllFroms-response.dto';

export type Form = Prisma.FormGetPayload<{
  include: {
    FormInput: true;
  };
}>;

export interface FormRepository extends BaseEventRepository<Form, Prisma.FormDelegate> {
  checkAuthor(id: number, userId: string): Promise<Result<boolean, Error>>;

  /* Create Form */
  createForm(dto: CreateFormDto, userEmail: string): Promise<Result<string, Error>>;

  /* Update Form */
  updateForm(dto: UpdateFormDto & { id: number }): Promise<Result<number, Error>>;

  /* Delete Form */
  deleteForm(id: number): Promise<Result<number, Error>>;

  /* Connect Form to SHowing */
  connectForm(dto: ConnectFormDto): Promise<Result<[ConnectFormResponseData, boolean], Error>>;

  findAllByOrganizerEmail(email: string): Promise<BasicFormDto[]>;
}