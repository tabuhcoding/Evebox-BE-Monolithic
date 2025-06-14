import { Controller, Post, Body, Request, Res, UseGuards, HttpStatus } from "@nestjs/common";
import { Response } from "express";
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "src/shared/guard/jwt-auth.guard";
import { CreateFormService } from "./createForm.service";
import { CreateFormDto } from "./createForm.dto";
import { CreateFormResponseDto } from "./createForm-response.dto";
import { SlackService } from "src/infrastructure/adapters/slack/slack.service";

@ApiTags('Event Service - Organizer - Form')
@Controller('api/org/showing')
export class CreateFormController {
  constructor(
    private readonly createFormService: CreateFormService,
    private readonly slackService: SlackService
  ) {}

  @UseGuards(JwtAuthGuard)
  @Post('/form')
  @ApiBearerAuth('access-token')
  @ApiBody({ type: CreateFormDto })
  @ApiOperation({ summary: 'Create a new form' })
  @ApiResponse({ status: 201, description: 'Form created successfully', type: CreateFormResponseDto })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async createForm(
    @Request() req,
    @Body() createFormDto: CreateFormDto,
    @Res() res: Response,
  ) {
    try {
      const email = req.user?.email;
      if (!email) {
        return res.status(HttpStatus.UNAUTHORIZED).json({
          statusCode: HttpStatus.UNAUTHORIZED,
          message: 'Unauthorized',
        });
      }

      const result = await this.createFormService.execute(createFormDto, email);
      
      if (result.isErr()) {
        return res.status(HttpStatus.BAD_REQUEST).json({
          statusCode: HttpStatus.BAD_REQUEST,
          message: result.unwrapErr().message,
        });
      }

      return res.status(HttpStatus.CREATED).json({
        statusCode: HttpStatus.CREATED,
        message: 'Form created successfully',
        data: { formId: result.unwrap() },
      });
    } catch (error) {
      await this.slackService.sendError(`EventSvc - Form >>> CreateFormController: ${error.message}`);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Internal server error',
      });
    }
  }
}