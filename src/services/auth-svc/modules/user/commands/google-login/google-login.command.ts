export class GoogleLoginCommand {
    constructor(
      public readonly fullname: string,
      public readonly username: string,
      public readonly email: string,
      public readonly avatar: string,
    ) {}
  }
  