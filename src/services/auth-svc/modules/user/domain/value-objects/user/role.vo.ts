import { ValueObject } from 'src/libs/ddd/value-object.base';
import { UserRole } from '../../enums/user-role.enum';
import { Result, Ok, Err } from 'oxide.ts';

interface RoleProps {
  value: UserRole;
}

export class Role extends ValueObject<RoleProps> {
  private constructor(props: RoleProps) {
    super(props);
  }

  public static create(role: UserRole): Result<Role, Error> {
    if (!Object.values(UserRole).includes(role)) {
      return Err(new Error('Invalid user role'));
    }
    return Ok(new Role({ value: role }));
  }

  public getValue(): UserRole {
    return this.props.value;
  }

  public isAdmin(): boolean {
    return (
      this.props.value === UserRole.ADMIN ||
      this.props.value === UserRole.SYSTEM_ADMIN
    );
  }

  public isOrganizer(): boolean {
    return this.props.value === UserRole.ORGANIZER;
  }

  public isCustomer(): boolean {
    return this.props.value === UserRole.CUSTOMER;
  }
}
