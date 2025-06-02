import { Inject, Injectable } from "@nestjs/common";
import { Prisma, OrgPaymentInfor } from "@prisma/client";
import { Result, Ok, Err } from "oxide.ts";

import { PrismaService } from "src/infrastructure/database/prisma/prisma.service";
import { BaseRepository } from "src/shared/repo/base.repository";
import { OrgPaymentInforRepository } from "./orgPaymentInfor.repo";
import { CreateOrgPaymentInfoDto } from "../../modules/orgPaymentInfor/commands/createOrgPaymentInfor/createOrgPaymentInfor.dto";

@Injectable()
export class OrgPaymentInforRepositoryImpl
  extends BaseRepository<OrgPaymentInfor, Prisma.OrgPaymentInforDelegate>
  implements OrgPaymentInforRepository {
  constructor(
    protected readonly prisma: PrismaService
  ) {
    super(prisma.orgPaymentInfor, prisma);
  }

  async createOrgPaymentInfo(dto: CreateOrgPaymentInfoDto, organizerId: string): Promise<Result<string, Error>> {
    try {
      const paymentInfoId = await this.insertOne({
        organizerId,
        accountName: dto.accountName,
        accountNumber: dto.accountNumber,
        bankName: dto.bankName,
        branch: dto.branch,
        businessType: dto.businessType,
        fullName: (dto.fullName && dto.fullName !== "") ? dto.fullName : "",
        address: (dto.address && dto.address !== "") ? dto.fullName : "",
        taxCode: (dto.taxCode && dto.taxCode !== "") ? dto.taxCode : "",
      });

      if (!paymentInfoId || typeof paymentInfoId !== 'string' || paymentInfoId.trim() === '') {
        return Err(new Error(`Failed to create payment info of organizer ${organizerId}`));
      }

      return Ok(paymentInfoId);
    } catch (error) {
      console.error(`Failed to create payment info: ${error.message}`);
      return Err(new Error(`Failed to create payment info: ${error.message}`));
    }
  }
}