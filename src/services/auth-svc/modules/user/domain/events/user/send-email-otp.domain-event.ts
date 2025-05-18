import { DomainEvent } from "src/libs/ddd/domain-event.base";
import { User } from '../../entities/user.entity';

export class SendEmailOTPDomainEvent extends DomainEvent {
  constructor(
    public readonly email: string,
    public readonly otp: string,
    public readonly type: string,
    public readonly expiresAt: Date,
  ) {
    super();
  }
}
