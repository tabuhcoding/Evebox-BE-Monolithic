import { Inject, Injectable } from "@nestjs/common";
import { Prisma, OrgPaymentInfor } from "@prisma/client";
import { Result, Ok, Err } from "oxide.ts";

import { PrismaService } from "src/infrastructure/database/prisma/prisma.service";
import { BaseRepository } from "src/shared/repo/base.repository";
import { OrgPaymentInforRepository } from "./orgPaymentInfor.repo";
import { Email } from "src/services/auth-svc/modules/user/domain/value-objects/user/email.vo";
import { Role } from "src/services/auth-svc/modules/user/domain/value-objects/user/role.vo";
import { UserRepository } from "src/services/auth-svc/repository/users/user.repository";
import { AdminRepository } from "src/services/auth-svc/repository/admin/admin.repository";
import { CreateOrgPaymentInfoDto } from "../../modules/orgPaymentInfor/commands/createOrgPaymentInfor/createOrgPaymentInfor.dto";
import { UpdateOrgPaymentInfoDto } from "../../modules/orgPaymentInfor/commands/updateOrgPaymentInfor/updateOrgPaymentInfor.dto";

@Injectable()
export class OrgPaymentInforRepositoryImpl
  extends BaseRepository<OrgPaymentInfor, Prisma.OrgPaymentInforDelegate>
  implements OrgPaymentInforRepository {
  constructor(
    @Inject('AdminRepository') private readonly adminRepository: AdminRepository,
    @Inject('UserRepository') private readonly userRepository: UserRepository,
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

      const emailOrError = Email.create(organizerId);
      if (emailOrError.isErr()) {
        return Err(emailOrError.unwrapErr());
      }

      const emailUnwrapped = emailOrError.unwrap();
      const user = await this.userRepository.findByEmail(emailUnwrapped);

      if (user.role.isCustomer) {
        const roleOrError = Role.create(3);
        if (roleOrError.isErr()) {
          return Err(roleOrError.unwrapErr());
        }
        await this.adminRepository.updateUserRole(organizerId, 2);
      }

      return Ok(paymentInfoId);
    } catch (error) {
      console.error(`Failed to create payment info: ${error.message}`);
      return Err(new Error(`Failed to create payment info: ${error.message}`));
    }
  }

  async updateOrgPaymentInfo(dto: UpdateOrgPaymentInfoDto, id: string, userEmail: string): Promise<Result<string, Error>> {
    try {
      const existing = await this.findOneById(id);

      if (existing.isDeleted) {
        return Err(new Error(`Payment info of ${userEmail} has been deleted, please create a new one!`));
      }

      const updated = await this.updateAndFindOneById(id, dto);

      if (!updated) {
        return Err(new Error(`Failed to update payment info of ${userEmail}`));
      }

      return Ok(updated.id);
    } catch (error) {
      console.error(`Failed to update payment info: ${error.message}`);
      return Err(new Error(`Failed to update payment info: ${error.message}`));
    }
  }

  async deleteOrgPaymentInfo(id: string): Promise<Result<string, Error>> {
    try {
      const existing = await this.findOneById(id);
      if (existing.isDeleted) {
        return Err(new Error('This payment info has been deleted'));
      }

      const deleted = await this.updateAndFindOneById(id, {
        isDeleted: true,
      });

      if (!deleted) {
        return Err(new Error(`Failed to update payment info`));
      }

      return Ok(deleted.id);
    } catch (error) {
      console.error(`Failed to delete payment info: ${error.message}`);
      return Err(new Error(`Failed to delete payment info: ${error.message}`));
    }
  }
}