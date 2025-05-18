import {
  Controller,
  Post,
  Body,
  Res,
  HttpStatus,
} from '@nestjs/common';
import { LoginResponse, LoginUserDto } from './login-user.dto';
import { LoginUserService } from './login-user.service';
import { Response } from 'express';
import { LoginUserCommand } from './login-user.command';
import { ApiBadRequestResponse, ApiOkResponse, ApiOperation, ApiResponse, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { ErrorHandler } from 'src/shared/exceptions/error.handler';
import { USER_MESSAGES } from 'src/shared/constants/constants';

@Controller('api/user')
@ApiTags('Authentication')
export class LoginUserController {
  constructor(private readonly loginUserService: LoginUserService) {}

  @Post('login')
  @ApiOperation({ 
    summary: 'User login',
    description: 'Authenticate user with email and password'
  })
  @ApiOkResponse({
    description: 'Login successful',
    type: LoginResponse
  })
  @ApiBadRequestResponse({
    description: 'Invalid input format'
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid credentials'
  })
  async login(@Body() loginUserDto: LoginUserDto, @Res() res: Response) {
    const command = new LoginUserCommand(
      loginUserDto.email,
      loginUserDto.password,
    );

    const result = await this.loginUserService.execute(command);

    if (result.isErr()) {
      return res
        .status(HttpStatus.BAD_REQUEST)
        .json(ErrorHandler.badRequest(result.unwrapErr().message));
    }

    const data = result.unwrap();

    return res.status(HttpStatus.OK).json({
      statusCode: HttpStatus.OK,
      message: USER_MESSAGES.SUCCESS.LOGIN,
      data: {
        ...data,
      },
    });
  }
}
