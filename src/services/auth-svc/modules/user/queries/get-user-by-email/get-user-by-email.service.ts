import { Inject, Injectable } from "@nestjs/common";
import { Result, Ok, Err } from "oxide.ts";
import { UserRepository } from "src/services/auth-svc/repository/users/user.repository";
import { Email } from "../../domain/value-objects/user/email.vo";
import { SlackService } from "src/infrastructure/adapters/slack/slack.service";
import { UserData } from "../get-user-by-id/get-user-by-id-response.dto";
import { AdminManageEventRepository } from "src/services/auth-svc/repository/admin-area/admin-area.repo";

@Injectable()
export class GetUserByEmailService {
  constructor(
    @Inject('UserRepository') private readonly userRepository: UserRepository,
    private readonly slackService: SlackService,
    @Inject('AdminManageEventRepository') private readonly adminManageEventRepository: AdminManageEventRepository,
  ) {}

  async execute(email: string): Promise<Result<UserData, Error>> {
    try {
      const emailOrError = Email.create(email);
      if (emailOrError.isErr()) {
        return Err(new Error(emailOrError.unwrapErr().message));
      }

      const user = await this.userRepository.findByEmail(emailOrError.unwrap());

      if (!user) {
        return Err(new Error('Failed to find user'))
      }

      const areaCodes = await this.adminManageEventRepository.findOne({email});

      return Ok({
        id: user.id.value, 
        name: user.name.value, 
        email: user.email.value,
        role: user.role.getValue(), 
        phone: user.phone.value,
        avatar_id: user.avatarId,
        created_at: user.created_at,
        status: user.status.getValue(),
        area: areaCodes ? areaCodes.area_code : null
      });
    } catch (error) {
      await this.slackService.sendError(`Auth Svc >>> GetUserByEmailService: ${error.message}`);
      return Err(new Error('Internal server error'));
    }
  }
}