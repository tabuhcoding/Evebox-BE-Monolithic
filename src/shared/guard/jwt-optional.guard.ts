// src/shared/guards/jwt-optional.guard.ts

import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtOptionalGuard extends AuthGuard('jwt') {
  handleRequest(err, user, info) {
    // no err & no user (no token) => {}
    if (err || !user) {
      return {}; // Trả về đối tượng trống nếu không có token
    }
    return user;
  }
}
