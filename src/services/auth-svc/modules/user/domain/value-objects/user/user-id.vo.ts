import { Result, Ok, Err } from 'oxide.ts';
import { Identifier } from 'src/libs/ddd/identifier.base';
import { v4 as uuidv4 } from 'uuid';

export class UserId extends Identifier<string> {
  // Tạo ID mới
  public static generate(): UserId {
    return new UserId(uuidv4());
  }

  // Tạo ID từ giá trị đã có
  public static create(id: string): Result<UserId, Error> {
    if (!id || id.trim().length === 0) {
      throw Err(new Error('UserId value cannot be empty or undefined'));
    }
    return Ok(new UserId(id));
  }
}
