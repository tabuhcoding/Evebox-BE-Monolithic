export class CreatePinUserCommand {
  constructor(
    public readonly pin: string,
    public readonly email: string,
  ) { }
}
