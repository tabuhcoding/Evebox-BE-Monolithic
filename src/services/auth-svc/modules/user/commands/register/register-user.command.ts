export class RegisterUserCommand {
    constructor(
      public readonly name: string,
      public readonly email: string,
      public readonly password: string,
      public readonly re_password: string,
      public readonly phone?: string,
      public readonly role_id?: number,
      public readonly province_id?: number[],
    ) {}
  }