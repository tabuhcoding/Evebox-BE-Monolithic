import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { UserRegisteredDomainEvent } from '../user/user-registered.domain-event';
import { EmailService } from 'src/infrastructure/adapters/email/email.service';

@EventsHandler(UserRegisteredDomainEvent)
export class SendWelcomeEmailHandler implements IEventHandler<UserRegisteredDomainEvent> {
  constructor(private readonly emailService: EmailService) {}

  async handle(event: UserRegisteredDomainEvent) {
    const user = event.user;
    await this.emailService.sendWelcomeEmail(user.email.value);
  }
}
