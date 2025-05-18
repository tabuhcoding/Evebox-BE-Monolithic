import { ValueObject } from 'src/libs/ddd/value-object.base';
import { Result, Ok, Err } from 'oxide.ts';

interface NameProps {
  value: string;
}

export class Name extends ValueObject<NameProps> {
  private constructor(props: NameProps) {
    super(props);
  }

  public static create(name: string): Result<Name, Error> {
    if (!name || name.trim().length === 0) {
      return Err(new Error('Name cannot be empty'));
    }
    const nameRegex = /^[A-Za-zÀ-ỹ\s]+$/;
    if (!nameRegex.test(name)) {
      return Err(new Error('Name contains invalid characters'));
    }
    return Ok(new Name({ value: name.trim() }));
  }

  get value(): string {
    return this.props.value;
  }
}
