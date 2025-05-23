import { ValueObject } from 'src/libs/ddd/value-object.base';
import { Result, Ok, Err } from 'oxide.ts';
import { UserStatus } from '@prisma/client';

interface StatusProps {
  value: UserStatus;
}

export class Status extends ValueObject<StatusProps> {
  private constructor(props: StatusProps) {
    super(props);
  }

  public static create(status: UserStatus): Result<Status, Error> {
    if (!Object.values(UserStatus).includes(status)) {
      return Err(new Error('Invalid user status'));
    }
    return Ok(new Status({ value: status }));
  }

  public getValue(): UserStatus {
    return this.props.value;
  }

  public isActive(): boolean {
    return this.props.value === UserStatus.ACTIVE;
  }
  
  public isDeactive(): boolean {
    return this.props.value === UserStatus.BLOCKED;
  }
}
