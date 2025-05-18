import { AggregateRoot } from 'src/libs/ddd/aggregate-root.base';
import { UserId } from '../value-objects/user/user-id.vo';
import { Email } from '../value-objects/user/email.vo';
import { Password } from '../value-objects/user/password.vo';
import { UserRole } from '../enums/user-role.enum';
import { Role } from '../value-objects/user/role.vo';
import { UserRegisteredDomainEvent } from '../events/user/user-registered.domain-event';
import { Name } from '../value-objects/user/name.vo';
import { Phone } from '../value-objects/user/phone.vo';
import { ProvinceId } from '../value-objects/user/province-id.vo';
import { Result, Ok, Err } from 'oxide.ts';
import { UserPasswordResetDomainEvent } from '../events/user/user-reset-password.domain-event';

interface UserProps {
  id: UserId;
  name: Name;
  email: Email;
  password: Password;
  phone: Phone;
  role: Role;
}

export class User extends AggregateRoot<UserId, UserProps> {
  private constructor(id: UserId, props: UserProps) {
    super(id, props);
  }

  /**
   * Phương thức tạo người dùng mới với danh sách ProvinceIds
   */
  public static async createNew(
    name: Name,
    email: Email,
    password: Password,
    phone: Phone,
    provinceIds: ProvinceId[], // Nhận danh sách ProvinceIds
    role: UserRole = UserRole.CUSTOMER,
  ): Promise<Result<User, Error>> {
    // Kiểm tra Role
    const roleOrError = Role.create(role);
    if (roleOrError.isErr()) {
      return Err(roleOrError.unwrapErr());
    }
    const roleVo = roleOrError.unwrap();

    try {
      const id = UserId.generate();
      const user = new User(id, {
        id,
        name,
        email,
        password,
        phone,
        role: roleVo,
      });

      user.addDomainEvent(new UserRegisteredDomainEvent(user));

      return Ok(user);
    } catch (error) {
      return Err(new Error('Failed to create user: ' + (error as Error).message));
    }
  }

  /**
   * Phương thức tạo người dùng từ dữ liệu persistence (từ database)
   */
  public static createExisting(
    id: UserId,
    name: Name,
    email: Email,
    password: Password,
    phone: Phone,
    role: Role,
  ): Result<User, Error> {
    return Ok(new User(id, {
      id,
      name,
      email,
      password, 
      phone,
      role,
    }));
  }
  
  public updatePassword(newPassword: Password): void {
    this.props.password = newPassword;
    
    // Add domain event
    this.addDomainEvent(
      new UserPasswordResetDomainEvent(this)
    );
  }

  // Các getter
  public get name(): Name {
    return this.props.name;
  }

  public get email(): Email {
    return this.props.email;
  }

  public get password(): Password {
    return this.props.password;
  }

  public get phone(): Phone {
    return this.props.phone;
  }

  public get role(): Role {
    return this.props.role;
  }
}
