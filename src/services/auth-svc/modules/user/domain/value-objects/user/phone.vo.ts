import { ValueObject } from 'src/libs/ddd/value-object.base';
import { Result, Ok, Err } from 'oxide.ts';

interface PhoneProps {
  value: string;
}

export class Phone extends ValueObject<PhoneProps> {
  private constructor(props: PhoneProps) {
    super(props);
  }

  public static create(phone: string): Result<Phone, Error> {
    const phoneRegex = /^[0-9]{10,15}$/; // Accept numbers between 10 and 15 digits
    if (!phoneRegex.test(phone)) {
      return Err(new Error('Invalid phone number format'));
    }
    return Ok(new Phone({ value: phone }));
  }

  get value(): string {
    return this.props.value;
  }
}
