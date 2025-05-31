import { Controller, Put, Param, Body, Res, HttpStatus, Request, UseGuards } from "@nestjs/common";
import { Response } from "express";
import { ApiOperation, ApiResponse, ApiTags, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
import { UpdateFormService } from "./updateForm.service";
import { UpdateFormDto } from "./updateForm.dto";
import { UpdateFormResponseDto } from "./updateForm-response.dto";
import { JwtAuthGuard } from "src/shared/guard/jwt-auth.guard";
import { SlackService } from "src/infrastructure/adapters/slack/slack.service";

@ApiTags('Event Service - Organizer - Form')
@Controller('api/org/showing')
export class UpdateFormController {
  constructor(
    private readonly updateFormService: UpdateFormService,
    private readonly slackService: SlackService
  ) {}

  @UseGuards(JwtAuthGuard)
  @Put('form/:id')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Update form of a showing' })
  @ApiParam({ name: 'id', description: 'Form ID need update' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Form updated successfully', type: UpdateFormResponseDto })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Bad request' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Internal server error' })
  async updateForm(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateFormDto,
    @Res() res: Response,
  ) {
    try {
      const user = req.user;
      const idNumber = Number(id);
      // Tạo đối tượng payload bao gồm id từ URL và dữ liệu từ body
      const updatePayload = {
        ...dto,
        id: idNumber,
        userEmail: user.email,
      };

      const result = await this.updateFormService.execute(updatePayload);
      if (result.isErr()) {
        return res.status(HttpStatus.BAD_REQUEST).json({
          statusCode: HttpStatus.BAD_REQUEST,
          message: result.unwrapErr().message,
        });
      }
      return res.status(HttpStatus.OK).json({
        statusCode: HttpStatus.OK,
        message: 'Form updated successfully',
        formId: result.unwrap(),
      });
    } catch (error) {
      this.slackService.sendError(`Event Service - Form >>> UpdateFormController: ${error.message}`);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Internal server error',
      });
    }
  }
}