import { BaseEventRepository } from '../base.repository';
import { OrgPaymentInfor } from "prisma/client-event";
import { Prisma } from "prisma/client-event";
import { Result } from "oxide.ts";

export { OrgPaymentInfor } from "prisma/client-event";
import { CreateOrgPaymentInfoDto } from "../../modules/orgPaymentInfor/commands/createOrgPaymentInfor/createOrgPaymentInfor.dto";
import { UpdateOrgPaymentInfoDto } from "../../modules/orgPaymentInfor/commands/updateOrgPaymentInfor/updateOrgPaymentInfor.dto";

export interface OrgPaymentInforRepository
  extends BaseEventRepository<OrgPaymentInfor, Prisma.OrgPaymentInforDelegate> {

  /* Create Organizer Payment Info */
  createOrgPaymentInfo(dto: CreateOrgPaymentInfoDto, organizerId: string): Promise<Result<string, Error>>;

  /* Update Organizer Payment Info */
  updateOrgPaymentInfo(dto: UpdateOrgPaymentInfoDto, id: string, userEmail: string): Promise<Result<string, Error>>;

  /* Delete Organizer Payment Info */
  deleteOrgPaymentInfo(id: string): Promise<Result<string, Error>>;
}