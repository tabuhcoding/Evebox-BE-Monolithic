import { Controller, Post, Body, Request, Res, HttpStatus, UseGuards } from "@nestjs/common";
import { Response } from "express";
import { ApiOperation, ApiResponse, ApiBody, ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { SubmitFormDto } from "./submitForm.dto";
import { SubmitFormService } from "./submitForm.service";
import { ErrorHandler } from "src/shared/exceptions/error.handler";
import { JwtAuthGuard } from "src/shared/guard/jwt-auth.guard";
import { SlackService } from "src/infrastructure/adapters/slack/slack.service";

@ApiTags('Booking Service - Booking')
@Controller('api/ticket')
export class SubmitFormController {
  constructor(
    private readonly submitFormService: SubmitFormService,
    private readonly slackService: SlackService
  ) {}

  @UseGuards(JwtAuthGuard)
  @Post('/submitForm')
    @ApiBearerAuth('access-token')

  @ApiOperation({ summary: 'Submit form responses' })
  @ApiBody({ type: SubmitFormDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Form submitted successfully',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid form data',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Internal server error',
  })
  async submitForm(
    @Request() req,
    @Body() submitFormDto: SubmitFormDto, 
    @Res() res: Response) {
    try {
      const email = req.user?.email;
      if (!email) {
        return res.status(HttpStatus.UNAUTHORIZED).json({
          statusCode: HttpStatus.UNAUTHORIZED,
          message: 'Unauthorized',
        });
      }

      const result = await this.submitFormService.execute(submitFormDto, email);

      if (result.isErr()) {
        const error = result.unwrapErr();
        const status = error.message === 'Invalid form data' ? HttpStatus.BAD_REQUEST : HttpStatus.INTERNAL_SERVER_ERROR;
        return res.status(status).json(ErrorHandler.badRequest(error.message));
      }

      return res.status(HttpStatus.OK).json({
        statusCode: HttpStatus.OK,
        message: 'Form submitted successfully',
        data: result.unwrap(),
      });
    } catch (error) {
      this.slackService.sendError(`Booking Service - Submit form >>> SubmitFormController: ${error.message}`);

      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(ErrorHandler.internalServerError('An unexpected error occurred'));
    }
  }
}