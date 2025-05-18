import { DomainEvent } from "src/libs/ddd/domain-event.base";
import { User } from '../../entities/user.entity';

export class UserRegisteredDomainEvent extends DomainEvent {
  constructor(public readonly user: User) {
    super();
  }
}
