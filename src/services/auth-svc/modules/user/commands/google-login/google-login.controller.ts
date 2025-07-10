import { Controller, Get, HttpStatus, Post, Body } from '@nestjs/common';
import { GoogleLoginService } from './google-login.service';
import { GoogleLoginCommand } from './google-login.command';
import { Result } from 'oxide.ts';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { GoogleLoginResponse, GoogleSigninDto } from './google-login.dto';

interface GoogleUser {
    fullname: string;
    username: string;
    email: string;
    avatar: string;
  }

@Controller('api/user/google')
@ApiTags('Authentication Service')
export class GoogleLoginController {
  constructor(private readonly googleLoginService: GoogleLoginService) {}

  @Post('signin')
  @ApiOperation({ 
    summary: 'Google signin for NextAuth',
    description: 'Handles Google signin from NextAuth frontend'
  })
  @ApiOkResponse({
    description: 'Signin successful',
    type: GoogleLoginResponse
  })
  async googleSignin(@Body() body: GoogleSigninDto) {
    try {
      const command = new GoogleLoginCommand(
        body.name,
        body.email.split('@')[0], // Use email prefix as username
        body.email,
        body.avatar || ''
      );
      
      const result: Result<{ access_token: string; refresh_token: string; id: string }, Error> =
        await this.googleLoginService.execute(command);

      if (result.isErr()) {
        throw new Error(result.unwrapErr().message);
      }

      const tokens = result.unwrap();
      
      return {
        statusCode: HttpStatus.OK,
        message: 'User logged in successfully',
        data: tokens
      };
    } catch (error) {
      throw new Error(`Google signin failed: ${error.message}`);
    }
  }

  /* @Get()
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
    const result: Result<{ access_token: string; refresh_token: string; id: string }, Error> =
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
  } */
}
