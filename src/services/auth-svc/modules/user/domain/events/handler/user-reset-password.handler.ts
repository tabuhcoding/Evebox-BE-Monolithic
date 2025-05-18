import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { Injectable } from '@nestjs/common';
import { UserPasswordResetDomainEvent } from '../user/user-reset-password.domain-event';
import { EmailService } from 'src/infrastructure/adapters/email/email.service';

@Injectable()
@EventsHandler(UserPasswordResetDomainEvent)
export class UserPasswordResetHandler 
  implements IEventHandler<UserPasswordResetDomainEvent> {
  
  constructor(private readonly emailService: EmailService) {}

  async handle(event: UserPasswordResetDomainEvent): Promise<void> {
    const { user } = event;

    // Send password changed notification email
    await this.emailService.sendPasswordResetConfirmation(user.email.value);
  }
}