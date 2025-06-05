export class VerifyUserPinCommand {
  constructor(
    public readonly pin: string,
    public readonly email: string,
  ) { }
}