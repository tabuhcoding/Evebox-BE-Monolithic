import { Injectable } from '@nestjs/common';
import { Result, Ok, Err } from 'oxide.ts';
import { Email } from 'src/services/auth-svc/modules/user/domain/value-objects/user/email.vo';
import { UserRepositoryImpl } from 'src/services/auth-svc/repository/users/user.repository.impl';
import { SlackService } from "src/infrastructure/adapters/slack/slack.service";

@Injectable()
export class SetReceiveNotiService {
 constructor(
    private readonly userRepository: UserRepositoryImpl,
    private readonly slackService: SlackService,
  ) {}

  async execute(emailStr: string, receive: boolean): Promise<Result<boolean, Error>> {
    const emailOrError = Email.create(emailStr);
    if (emailOrError.isErr()) {
      return Err(new Error('Invalid email format'));
    }

    const email = emailOrError.unwrap();
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      return Err(new Error('User not found'));
    }

    try {
      await this.userRepository.setReceiveNoti(user.id.value, receive);
      return Ok(true);
    } catch(error) {
      this.slackService.sendError(` Auth Svc - User >>> SetReceiveNoti: ${error}`);
      
      return Err(new Error('Failed to update notification preference'));
    }
  }
}
