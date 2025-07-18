import { Inject, Injectable } from "@nestjs/common";
import { Result, Ok, Err } from "oxide.ts";
import { UserRepository } from "src/services/auth-svc/repository/users/user.repository";
import { UserId } from "../../domain/value-objects/user/user-id.vo";
import { SlackService } from "src/infrastructure/adapters/slack/slack.service";
import { UserData } from "./get-user-by-id-response.dto";

@Injectable()
export class GetUserByIdService {
  constructor(
    @Inject('UserRepository') private readonly userRepository: UserRepository,
    
    private readonly slackService: SlackService,
  ) {}

  async execute(id: string): Promise<Result<UserData, Error>> {
    try {
      const idOrError = UserId.create(id);
      if (idOrError.isErr()) {
        return Err(new Error(idOrError.unwrapErr().message));
      }

      const user = await this.userRepository.findById(idOrError.unwrap());
      if (!user) {
        return Err(new Error('Failed to find user'));
      }

      return Ok({
        id: user.id.value, 
        name: user.name.value, 
        email: user.email.value,
        role: user.role.getValue(), 
        phone: user.phone.value,
        avatar_id: user.avatarId,
        created_at: user.created_at,
        status: user.status.getValue(),
      });
    } catch (error) {
      await this.slackService.sendError(`Auth Svc >>> GetUserByIdService: ${error.message}`);
      return Err(new Error('Internal server error'));
    }
  }
}