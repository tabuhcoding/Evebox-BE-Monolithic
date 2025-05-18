import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { Injectable } from '@nestjs/common';
import { EmailService } from 'src/infrastructure/adapters/email/email.service';
import { SendEmailOTPDomainEvent } from '../user/send-email-otp.domain-event';

@Injectable()
@EventsHandler(SendEmailOTPDomainEvent)
export class SendEmailOtpHandler 
  implements IEventHandler<SendEmailOTPDomainEvent> {
  
  constructor(private readonly emailService: EmailService) {}

  async handle(event: SendEmailOTPDomainEvent): Promise<void> {
    const { email, otp, type } = event;

    // Send OTP via email
    await this.emailService.sendOTPEmail(
      email,
      otp,
      type,
    );
  }
}