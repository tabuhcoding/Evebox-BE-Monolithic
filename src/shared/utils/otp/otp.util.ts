import { Injectable } from '@nestjs/common';
import { OTPType } from 'src/modules/user/domain/enums/otp-type.enum';
import { v4 } from 'uuid';
import * as jwt from 'jsonwebtoken';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class OtpUtils {
  constructor(private readonly configService: ConfigService) {}

  generateToken(email: string, type: OTPType): string {
    const timestamp = Date.now();
    const randomString = v4();
    return `${email}_${type}_${timestamp}_${randomString}`;
  }

  generateRequestToken(email: string, type: string): string {
    const uniqueIdentifier = Buffer.from(`${email}:${type}`).toString('base64');

    return jwt.sign(
      {
        kind: 'verify_email',
        payload: {
          email,
          type,
        },
        jti: uniqueIdentifier, // Add as JWT ID
      },
      this.configService.get('JWT_SECRET'),
      {
        expiresIn: '1h',
        noTimestamp: true, // Remove iat claim
      },
    );
  }
}
