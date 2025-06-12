import { Controller, Delete, Param, Res, HttpStatus, UseGuards, Request } from "@nestjs/common";
import { Response } from "express";
import { ApiOperation, ApiResponse, ApiParam, ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { DeleteOrgPaymentInfoService } from "./deleteOrgPaymentInfor.service";
import { DeleteOrgPaymentInfoResponseDto } from "./deleteOrgPaymentInfor-response.dto";
import { JwtAuthGuard } from "src/shared/guard/jwt-auth.guard";
import { SlackService } from "src/infrastructure/adapters/slack/slack.service";

@ApiTags('Event Service - Organizer - Payment Info')
@Controller('api/org/payment')
export class DeleteOrgPaymentInfoController {
  constructor(
    private readonly deleteOrgPaymentInfoService: DeleteOrgPaymentInfoService,
    private readonly slackService: SlackService
  ) { }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @Delete('/:id')
  @ApiOperation({ summary: 'Delete Org Payment Information' })
  @ApiParam({ name: 'id', type: String, description: 'OrgPaymentInfo ID to delete' })
  @ApiResponse({ status: HttpStatus.OK, description: 'OrgPaymentInfo deleted successfully', type: DeleteOrgPaymentInfoResponseDto })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Bad request' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Internal server error' })
  async deletePaymentInfo(
    @Param('id') id: string,
    @Res() res: Response,
    @Request() req
  ) {
    try {
      if (!id) {
        return res.status(HttpStatus.BAD_REQUEST).json({
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Showing id is required',
        });
      }

      const email = req.user?.email;
      if (!email) {
        return res.status(HttpStatus.UNAUTHORIZED).json({
          statusCode: HttpStatus.UNAUTHORIZED,
          message: 'Unauthorized',
        });
      }
      const result = await this.deleteOrgPaymentInfoService.execute(id, email);
      if (result.isErr()) {
        return res.status(HttpStatus.BAD_REQUEST).json({
          statusCode: HttpStatus.BAD_REQUEST,
          message: result.unwrapErr().message,
        });
      }
      return res.status(HttpStatus.OK).json({
        statusCode: HttpStatus.OK,
        message: 'OrgPaymentInfo deleted successfully',
        data: { id: result.unwrap() },
      });
    } catch (error) {
      await this.slackService.sendError(`Event Service - OrgPaymentInfo >>> DeleteOrgPaymentInfoController: ${error.message}`);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Internal server error',
      });
    }
  }
}