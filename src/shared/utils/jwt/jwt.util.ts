import { Injectable } from '@nestjs/common';
// import { OTPType } from 'src/modules/user/domain/enums/otp-type.enum';
import { v4 } from 'uuid';
import * as jwt from 'jsonwebtoken';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class JwtUtils {
  constructor(
    private readonly jwtService: JwtService,
  ) {}

  // generateToken(email: string, type: OTPType): string {
  //   const timestamp = Date.now();
  //   const randomString = v4();
  //   return `${email}_${type}_${timestamp}_${randomString}`;
  // }

  // generateRequestToken(email: string, type: string): string {
  //   const uniqueIdentifier = Buffer.from(`${email}:${type}`).toString('base64');

  //   return this.jwtService.sign(
  //     {
  //       kind: 'verify_email',
  //       payload: {
  //         email,
  //         type,
  //       },
  //       jti: uniqueIdentifier, // Add as JWT ID
  //     },
  //     {
  //       expiresIn: '1h',
  //       noTimestamp: true, // Remove iat claim
  //     },
  //   );
  // }
}