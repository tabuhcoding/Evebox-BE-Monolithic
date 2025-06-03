import { BaseRepository } from "src/shared/repo/base.repository";
import { OrgPaymentInfor } from "@prisma/client";
import { Prisma } from "@prisma/client";
import { Result } from "oxide.ts";

export { OrgPaymentInfor } from "@prisma/client";
import { CreateOrgPaymentInfoDto } from "../../modules/orgPaymentInfor/commands/createOrgPaymentInfor/createOrgPaymentInfor.dto";
import { UpdateOrgPaymentInfoDto } from "../../modules/orgPaymentInfor/commands/updateOrgPaymentInfor/updateOrgPaymentInfor.dto";

export interface OrgPaymentInforRepository
  extends BaseRepository<OrgPaymentInfor, Prisma.OrgPaymentInforDelegate> {

  /* Create Organizer Payment Info */
  createOrgPaymentInfo(dto: CreateOrgPaymentInfoDto, organizerId: string): Promise<Result<string, Error>>;

  /* Update Organizer Payment Info */
  updateOrgPaymentInfo(dto: UpdateOrgPaymentInfoDto, id: string, userEmail: string): Promise<Result<string, Error>>;
}