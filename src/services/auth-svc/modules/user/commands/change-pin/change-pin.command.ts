export class ChangeUserPinCommand {
  constructor(
    public readonly pin: string,
    public readonly email: string,
  ) { }
}
