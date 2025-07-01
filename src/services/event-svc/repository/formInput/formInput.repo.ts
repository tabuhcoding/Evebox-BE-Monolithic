import { BaseEventRepository } from '../base.repository';
import { FormInput, Prisma } from "prisma/client-event";

export { FormInput }

export interface FormInputRepository extends BaseEventRepository<FormInput, Prisma.FormInputDelegate> {

}