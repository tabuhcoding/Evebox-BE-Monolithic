import { Controller, Delete, Param, Res, Request, HttpStatus, UseGuards } from "@nestjs/common";
import { Response } from "express";
import { ApiOperation, ApiResponse, ApiTags, ApiParam, ApiBearerAuth } from "@nestjs/swagger";
import { DeleteFormResponseDto } from "./deleteForm-response.dto";
import { DeleteFormService } from "./deleteForm.service";
import { JwtAuthGuard } from 'src/shared/guard/jwt-auth.guard';
import { SlackService } from "src/infrastructure/adapters/slack/slack.service";

@ApiTags('Event Service - Organizer - Form')
@Controller('api/org/showing')
export class DeleteFormController {
  constructor(
    private readonly deleteFormService: DeleteFormService,
    private readonly slackService: SlackService
  ) { }

  @UseGuards(JwtAuthGuard)
  @Delete('/form/:id')
  @ApiBearerAuth('access-token')
  @ApiParam({ name: 'id', example: "123", description: "The ID of the form need to delete" })
  @ApiOperation({ summary: 'Delete a form' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Form deleted successfully', type: DeleteFormResponseDto })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Bad request' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Internal server error' })
  async deleteForm(
    @Param('id') id: number,
    @Res() res: Response,
    @Request() req
  ) {
    try {
      if (!id) {
        return res.status(HttpStatus.BAD_REQUEST).json({
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Form id is required',
        });
      }

      const email = req.user?.email;

      const result = await this.deleteFormService.execute(Number(id), email);
      if (result.isErr()) {
        return res.status(HttpStatus.BAD_REQUEST).json({
          statusCode: HttpStatus.BAD_REQUEST,
          message: result.unwrapErr().message,
        });
      }

      return res.status(HttpStatus.OK).json({
        statusCode: HttpStatus.OK,
        message: 'Form deleted successfully',
        data: { formId: result.unwrap() },
      });
    } catch (error) {
      await this.slackService.sendError(`EventSvc - Form >>> DeleteFormController: ${error.message}`);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Internal server error',
      });
    }
  }
}