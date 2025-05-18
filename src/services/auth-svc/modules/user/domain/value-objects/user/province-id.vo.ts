import { ValueObject } from "src/libs/ddd/value-object.base";
import { Result, Ok, Err } from 'oxide.ts';

export class ProvinceId extends ValueObject<number> {
  private constructor(value: number) {
    super(value);
  }

  static create(id: number): Result<ProvinceId, Error> {
    if (!Number.isInteger(id) || id <= 0) {
      return Err(new Error('Invalid Province ID'));
    }
    return Ok(new ProvinceId(id));
  }

  static createList(ids?: number[]): Result<ProvinceId[], Error> {
    if (!ids || ids.length === 0) {
      return Ok([]); // Cho phép danh sách rỗng nếu province_id không được cung cấp
    }

    const provinceIds: ProvinceId[] = [];
    for (const id of ids) {
      const provinceIdOrError = ProvinceId.create(id);
      if (provinceIdOrError.isErr()) {
        return Err(provinceIdOrError.unwrapErr());
      }
      provinceIds.push(provinceIdOrError.unwrap());
    }
    return Ok(provinceIds);
  }

  get value(): number {
    return this.props;
  }
}
