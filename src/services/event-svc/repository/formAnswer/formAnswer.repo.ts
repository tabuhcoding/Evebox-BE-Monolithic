import { BaseEventRepository } from '../base.repository';
import { Prisma } from "prisma/client-event";

export type FormAnswer = Prisma.FormAnswerGetPayload<{
  include: {
    FormInput: true;
  };
}>;

export interface FormAnswerRepository extends BaseEventRepository<FormAnswer, Prisma.FormAnswerDelegate> {

}