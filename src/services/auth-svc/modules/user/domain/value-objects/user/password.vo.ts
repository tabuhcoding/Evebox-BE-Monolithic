import { ValueObject } from "src/libs/ddd/value-object.base";
import { hash, compare } from 'bcryptjs';
import { Result, Ok, Err } from 'oxide.ts';

interface PasswordProps {
  value: string;
}

export class Password extends ValueObject<PasswordProps> {
  private constructor(props: PasswordProps) {
    super(props);
  }

  public static async create(plainPassword: string): Promise<Result<Password, Error>> {
    // Kiểm tra độ dài mật khẩu
    if (!plainPassword || plainPassword.length < 6) {
      return Err(new Error('Password must be at least 6 characters long'));
    }

    // Hash mật khẩu
    try {
      const hashedPassword = await hash(plainPassword, 10);
      return Ok(new Password({ value: hashedPassword }));
    } catch (error) {
      return Err(new Error('Failed to hash password'));
    }
  }

  public static createHashed(hashedPassword: string): Result<Password, Error> {
    // Tạo đối tượng Password từ giá trị đã được hash
    return Ok(new Password({ value: hashedPassword }));
  }

  public async comparePassword(plainPassword: string): Promise<boolean> {
    return await compare(plainPassword, this.props.value);
  }

  public getHashedValue(): string {
    return this.props.value;
  }
}
