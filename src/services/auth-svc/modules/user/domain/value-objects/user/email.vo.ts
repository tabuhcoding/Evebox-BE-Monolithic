import { ValueObject } from 'src/libs/ddd/value-object.base';
import { Result, Ok, Err } from 'oxide.ts';

interface EmailProps {
  value: string;
}

export class Email extends ValueObject<EmailProps> {
  private constructor(props: EmailProps) {
    super(props);
  }
  
  public static create(email: string): Result<Email, Error> {
    if (!email || email.trim().length === 0) {
      return Err(new Error('Email cannot be empty'));
    }
    
    // RFC 5322 compliant email regex
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

    if (!emailRegex.test(email.trim())) {
      return Err(new Error('Invalid email address'));
    }

    return Ok(new Email({ value: email.trim() }));
}

  get value(): string {
    return this.props.value;
  }
}
