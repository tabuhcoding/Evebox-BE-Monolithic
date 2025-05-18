import { Controller, Get, HttpStatus, Req, Res, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { GoogleLoginService } from './google-login.service';
import { GoogleLoginCommand } from './google-login.command';
import { Response } from 'express';
import { Result } from 'oxide.ts';
import { ApiOkResponse, ApiOperation, ApiResponse, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { GoogleLoginDto, GoogleLoginResponse } from './google-login.dto';
import { ErrorHandler } from 'src/shared/exceptions/error.handler';

interface GoogleUser {
    fullname: string;
    username: string;
    email: string;
    avatar: string;
  }

@Controller('api/user/google')
@ApiTags('Authentication')
export class GoogleLoginController {
  constructor(private readonly googleLoginService: GoogleLoginService) {}

  @Get()
  @UseGuards(AuthGuard('google'))
  async googleLogin() {
    // Kích hoạt Passport Google Guard
  }

  @Get('callback')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ 
    summary: 'Google OAuth2 callback',
    description: 'Handles the Google OAuth2 callback and returns JWT tokens'
  })
  @ApiOkResponse({
    description: 'Login successful',
    type: GoogleLoginResponse
  })
  @ApiUnauthorizedResponse({
    description: 'Authentication failed'
  })
  async googleLoginCallback(@Req() req: GoogleLoginDto & {user: GoogleUser}, @Res() res: Response) {
    try {
    const command = new GoogleLoginCommand(req.user.fullname, req.user.username, req.user.email, req.user.avatar);
    const result: Result<{ access_token: string; refresh_token: string }, Error> =
      await this.googleLoginService.execute(command);

    if (result.isErr()) {
      return res
        .status(HttpStatus.OK)
        .json(ErrorHandler.unauthorized(result.unwrapErr().message));
    }

    const tokens = result.unwrap();

    // Return HTML that sends tokens via postMessage
    return res.send(`
      <html>
        <body>
          <script>
            if (window.opener) {
              window.opener.postMessage(
                {
                  type: 'GOOGLE_LOGIN_SUCCESS',
                  data: ${JSON.stringify(tokens)}
                }, 
                'http://localhost:3000/'
              );
              window.close();
            }
          </script>
        </body>
      </html>
    `);
    } catch (error) {
      return res.send(`
      <script>
        if (window.opener) {
          window.opener.postMessage(
            {
              type: 'GOOGLE_LOGIN_ERROR',
              error: 'Authentication failed'
            }, 
            'http://localhost:3000/'
          );
          window.close();
        }
      </script>
    `);
    }
  }
}
