import { OTPType } from '../../../domain/enums/otp-type.enum';
import { VerifyOTPDto } from './verify-otp.dto';

export class VerifyOTPCommand {
  constructor(
    public readonly email: string,
    public readonly otp: string,
    public readonly type: OTPType,
    public readonly request_token: string
  ) {}

  static create(dto: VerifyOTPDto): VerifyOTPCommand {
    return new VerifyOTPCommand(
      dto.email,
      dto.otp,
      dto.type,
      dto.request_token,
    );
  }
}