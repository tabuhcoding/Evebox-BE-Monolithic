import { ValueObject } from 'src/libs/ddd/value-object.base';
import { Result, Ok, Err } from 'oxide.ts';

interface AvatarProps {
  value: number;
}

export class Avatar extends ValueObject<AvatarProps> {
  private constructor(props: AvatarProps) {
    super(props);
  }

  public static create(avatarId: number): Result<Avatar, Error> {
    return Ok(new Avatar({ value: avatarId }));
  }

  get value(): number {
    return this.props.value;
  }
}
