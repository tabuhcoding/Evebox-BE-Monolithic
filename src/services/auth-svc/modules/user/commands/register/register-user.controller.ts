import { Controller, Post, Body, Res, HttpStatus } from '@nestjs/common';
import { RegisterResponse, RegisterUserDto } from './register-user.dto';
import { RegisterUserService } from './register-user.service';
import { RegisterUserCommand } from './register-user.command';
import { Response } from 'express';
import { ApiBadRequestResponse, ApiOkResponse, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ErrorHandler } from 'src/shared/exceptions/error.handler';
import { USER_MESSAGES } from 'src/shared/constants/constants';

@Controller('/api/user')
@ApiTags('Authentication')
export class RegisterUserController {
  constructor(private readonly registerUserService: RegisterUserService) { }

  @Post('register')
  @ApiOperation({
    summary: 'Register new user',
    description: 'Register new user and send OTP for verification'
  })
  @ApiOkResponse({
    description: 'OTP sent successfully',
    type: RegisterResponse
  })
  @ApiBadRequestResponse({
    description: 'Bad request - Invalid input data'
  })
  async register(
    @Body() registerUserDto: RegisterUserDto,
    @Res() res: Response,
  ) {
    const command = new RegisterUserCommand(
      registerUserDto.name,
      registerUserDto.email,
      registerUserDto.password,
      registerUserDto.re_password,
      registerUserDto.phone,
      registerUserDto.role_id,
      registerUserDto.province_id,
    );

    const result = await this.registerUserService.execute(command);

    if (result.isErr()) {
      return res.status(400).json({
        statusCode: HttpStatus.BAD_REQUEST,
        message: result.unwrapErr().message
      });
    }

    return res.status(200).json({
      statusCode: HttpStatus.OK,
      message: USER_MESSAGES.SUCCESS.REGISTER,
      data: {
        ...result.unwrap(),
      }
    });
  }
}
