import { BaseRepository } from "src/shared/repo/base.repository";
import { Prisma } from "@prisma/client";

export type FormAnswer = Prisma.FormAnswerGetPayload<{
  include: {
    FormInput: true;
  };
}>;

export interface FormAnswerRepository extends BaseRepository<FormAnswer, Prisma.FormAnswerDelegate> {

}