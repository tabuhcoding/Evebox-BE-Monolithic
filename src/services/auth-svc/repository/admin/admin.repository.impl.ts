import { Injectable } from "@nestjs/common";
import { AdminRepository } from "./admin.repository";
import { PrismaService } from "src/infrastructure/database/prisma/prisma.service";
import { Prisma, UserStatus } from "@prisma/client";
import { User } from "../../modules/user/domain/entities/user.entity";
import { UserId } from "../../modules/user/domain/value-objects/user/user-id.vo";
import { EventBus } from "@nestjs/cqrs";
import { Email } from "../../modules/user/domain/value-objects/user/email.vo";
import { Name } from "../../modules/user/domain/value-objects/user/name.vo";
import { Phone } from "../../modules/user/domain/value-objects/user/phone.vo";
import { Password } from "../../modules/user/domain/value-objects/user/password.vo";
import { Status } from "../../modules/user/domain/value-objects/user/status.vo";
import { Avatar } from "../../modules/user/domain/value-objects/user/avatar.vo";
import { Role } from "../../modules/user/domain/value-objects/user/role.vo";
import { UserRole } from "../../modules/user/domain/enums/user-role.enum";

@Injectable()
export class AdminRepositoryImpl implements AdminRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventBus: EventBus
  ) { }

  async updateUserStatus(userId: string, status: UserStatus): Promise<void> {
    const userData = await this.prisma.user.findUnique({
      where: {
        email: userId,
      },
      include: {
        role: true,
      },
    });

    const user = this.mapToDomain(userData);

    user.updateStatus(Status.create(status).unwrap());

    await this.prisma.user.update({
      where: {
        email: userId
      },
      data: {
        status: status
      }
    });

    const domainEvents = user.getDomainEvents();
    for (const event of domainEvents) {
      await this.eventBus.publish(event);
    }
    user.clearDomainEvents();
  }

  async updateUserRole(userId: string, role: UserRole): Promise<void> {
    const userData = await this.prisma.user.findUnique({
      where: {
        email: userId
      },
      include: {
        role: true,
      }
    });

    const user = this.mapToDomain(userData);

    user.updateRole(Role.create(role).unwrap());

    await this.prisma.user.update({
      where: {
        email: userId,
      },
      data: {
        role_id: role,
      }
    });

    const domainEvents = user.getDomainEvents();
    for (const event of domainEvents) {
      await this.eventBus.publish(event);
    }
    user.clearDomainEvents();
  }

  private mapToDomain(
    userRecord: Prisma.UserGetPayload<{
      include: {
        role: true,
      };
    }>
  ): User {
    const userIdOrError = UserId.create(userRecord.id);
    if (userIdOrError.isErr()) {
      throw new Error(userIdOrError.unwrapErr().message);
    }
    const userId = userIdOrError.unwrap();

    const nameOrError = Name.create(userRecord.name);
    if (nameOrError.isErr()) {
      throw new Error(nameOrError.unwrapErr().message);
    }
    const name = nameOrError.unwrap();

    const emailOrError = Email.create(userRecord.email);
    if (emailOrError.isErr()) {
      throw new Error(emailOrError.unwrapErr().message);
    }
    const email = emailOrError.unwrap();

    const passwordOrError = Password.createHashed(userRecord.password);
    if (passwordOrError.isErr()) {
      throw new Error(passwordOrError.unwrapErr().message);
    }
    const password = passwordOrError.unwrap();

    const phoneOrError = Phone.create(userRecord.phone);
    if (phoneOrError.isErr()) {
      throw new Error(phoneOrError.unwrapErr().message);
    }
    const phone = phoneOrError.unwrap();

    const roleOrError = Role.create(userRecord.role.id);
    if (roleOrError.isErr()) {
      throw new Error(roleOrError.unwrapErr().message);
    }
    const role = roleOrError.unwrap();

    const avatarIdOrError = Avatar.create(userRecord.avatar_id);
    if (avatarIdOrError.isErr()) {
      throw new Error(avatarIdOrError.unwrapErr().message);
    }
    const avatarId = avatarIdOrError.unwrap();

    const statusOrError = Status.create(userRecord.status);
    if (statusOrError.isErr()) {
      throw new Error(statusOrError.unwrapErr().message);
    }
    const status = statusOrError.unwrap();

    const createAt = userRecord.created_at;

    const userOrError = User.createExisting(
      userId,
      name,
      email,
      password,
      phone,
      role,
      avatarId,
      status,
      createAt
    );
    if (userOrError.isErr()) {
      throw new Error(userOrError.unwrapErr().message);
    }

    return userOrError.unwrap();
  }
}