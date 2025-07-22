import { BaseAuthRepository } from "../base.repository";
import { Prisma } from "prisma/client-auth";

export type AIAnalyst = Prisma.AIAnalystGetPayload<{
  // Define the fields you want to include in the AIAnalyst type
}>;

export interface AIAnalystRepository extends BaseAuthRepository<AIAnalyst, Prisma.AIAnalystDelegate> {
  // Define any additional methods specific to AIAnalystRepository if needed
  // For example, methods to create, update, or find AIAnalyst records
}