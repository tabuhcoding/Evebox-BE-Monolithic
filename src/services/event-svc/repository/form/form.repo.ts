import { BaseRepository } from "src/shared/repo/base.repository";
import { Prisma } from "@prisma/client";

export type Form = Prisma.FormGetPayload<{
  include: {
    FormInput: true;
  };
}>;

export interface FormRepository extends BaseRepository<Form, Prisma.FormDelegate> {
}