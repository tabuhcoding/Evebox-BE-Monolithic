import { Identifier } from 'src/libs/ddd/identifier.base';
import { v4 as uuidv4 } from 'uuid';

export class OTPId extends Identifier<string> {
  static generate(): OTPId {
    return new OTPId(uuidv4());
  }
}