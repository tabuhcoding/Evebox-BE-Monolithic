import { BaseRepository } from "src/shared/repo/base.repository";
import { FormAnswer, Prisma } from "@prisma/client";

export { FormAnswer }

export interface FormAnswerRepository extends BaseRepository<FormAnswer, Prisma.FormAnswerDelegate> {

}