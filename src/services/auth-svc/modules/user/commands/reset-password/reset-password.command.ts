import { ResetPasswordDto } from './reset-password.dto';

export class ResetPasswordCommand {
  constructor(
    public readonly resetToken: string,
    public readonly newPassword: string,
    public readonly confirmPassword: string,
  ) {}

  static create(dto: ResetPasswordDto): ResetPasswordCommand {
    return new ResetPasswordCommand(
      dto.resetToken,
      dto.newPassword,
      dto.confirmPassword,
    );
  }
}