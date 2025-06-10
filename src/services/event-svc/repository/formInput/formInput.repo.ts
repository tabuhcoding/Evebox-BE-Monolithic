import { BaseRepository } from "src/shared/repo/base.repository";
import { FormInput, Prisma } from "@prisma/client";

export { FormInput }

export interface FormInputRepository extends BaseRepository<FormInput, Prisma.FormInputDelegate> {

}