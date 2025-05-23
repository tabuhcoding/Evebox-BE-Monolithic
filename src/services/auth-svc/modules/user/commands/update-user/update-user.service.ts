import { Inject, Injectable } from "@nestjs/common";
import { Result, Ok, Err } from "oxide.ts";
import { UserRepositoryImpl } from "src/services/auth-svc/repository/users/user.repository.impl";
import { UserRepository } from "src/services/auth-svc/repository/users/user.repository";
import { USER_MESSAGES } from "src/shared/constants/constants";
import { Email } from "../../domain/value-objects/user/email.vo";
import { Name } from "../../domain/value-objects/user/name.vo";
import { Phone } from "../../domain/value-objects/user/phone.vo";
import { Avatar } from "../../domain/value-objects/user/avatar.vo";
import { SlackService } from "src/infrastructure/adapters/slack/slack.service";
import { UpdateUserDto } from "./update-user.dto";
import { UpdateUserData } from "./update-user-response.dto";
@Injectable()
export class UpdateUserService {
  constructor(
    @Inject('UserRepository') private readonly userRepository: UserRepository,
    private readonly slackService: SlackService
  ) {}

  async execute(dto: UpdateUserDto, email: string): Promise<Result<UpdateUserData, Error>> {
    try {
      const emailOrError = Email.create(email);
      if (emailOrError.isErr()) {
        return Err(emailOrError.unwrapErr());
      }

      const emailUnwrapped = emailOrError.unwrap();

      const user = await this.userRepository.findByEmail(emailUnwrapped);
      if (!user) {
        return Err(new Error(USER_MESSAGES.ERRORS.USER_NOT_FOUND));
      }

      if (dto.name) {
        const nameOrError = Name.create(dto.name);
        if (nameOrError.isErr()) {
          return Err(nameOrError.unwrapErr());
        }
        const name = nameOrError.unwrap();
        user.updateName(name);
      }

      if (dto.phone) {
        const phoneOrError = Phone.create(dto.phone);
        if (phoneOrError.isErr()) {
          return Err(phoneOrError.unwrapErr());
        }
        const phone = phoneOrError.unwrap();
        user.updatePhone(phone);
      }

      if (dto.avatar_id) {
        const avatarIdOrError = Avatar.create(dto.avatar_id);
        if (avatarIdOrError.isErr()) {
          return Err(avatarIdOrError.unwrapErr());
        }
        const avatarId = avatarIdOrError.unwrap();
        user.updateAvatarId(avatarId);
      }

      await this.userRepository.updateUserInfo(user);

      return Ok({
        userEmail: user.email.value,
        userId: user.id.value
      })
    } catch (error) {
      this.slackService.sendError(`AuthSvc - User >>> UpdateUserService: ${error.message}`);

      return Err(new Error('Failed to update user info'));
    }
  }
}