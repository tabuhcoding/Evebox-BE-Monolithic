import { Request, Res, HttpStatus, Body, UseGuards, Param, Put, Controller } from "@nestjs/common";
import { Response } from "express";
import { ApiOperation, ApiResponse, ApiParam, ApiBody, ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from "src/shared/guard/jwt-auth.guard";
import { UpdateOrgPaymentInfoService } from "./updateOrgPaymentInfor.service";
import { UpdateOrgPaymentInfoDto } from "./updateOrgPaymentInfor.dto";
import { UpdateOrgPaymentInfoResponseDto } from "./updateOrgPaymentInfor-response.dto";
import { SlackService } from "src/infrastructure/adapters/slack/slack.service";

@ApiTags('Event Service - Organizer - Payment Info')
@Controller('api/org/payment') export class UpdateOrgPaymentInfoController {
  constructor(
    private readonly updateOrgPaymentInfoService: UpdateOrgPaymentInfoService,
    private readonly slackService: SlackService
  ) { }

  @UseGuards(JwtAuthGuard)
  @Put(':id')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Update Org Payment Information by id' })
  @ApiParam({ name: 'id', type: String, description: 'OrgPaymentInfo ID to update' })
  @ApiBody({ type: UpdateOrgPaymentInfoDto })
  @ApiResponse({ status: HttpStatus.OK, description: 'OrgPaymentInfo updated successfully', type: UpdateOrgPaymentInfoResponseDto })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Bad request' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Internal server error' })
  async updatePaymentInfo(
    @Param('id') id: string,
    @Body() dto: UpdateOrgPaymentInfoDto,
    @Res() res: Response,
    @Request() req
  ) {
    try {
      if(!id) {
        return res.status(HttpStatus.BAD_REQUEST).json({
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Payment info id is required',
        });
      }

      const email = req.user?.email;
      if (!email) {
        return res.status(HttpStatus.UNAUTHORIZED).json({
          statusCode: HttpStatus.UNAUTHORIZED,
          message: 'Unauthorized',
        });
      }

      const result = await this.updateOrgPaymentInfoService.execute(dto, id, email);
      if (result.isErr()) {
        return res.status(HttpStatus.BAD_REQUEST).json({
          statusCode: HttpStatus.BAD_REQUEST,
          message: result.unwrapErr().message,
        });
      }
      return res.status(HttpStatus.OK).json({
        statusCode: HttpStatus.OK,
        message: 'OrgPaymentInfo updated successfully',
        data: { id: result.unwrap() },
      });
    } catch (error) {
      await this.slackService.sendError(`Event Service - OrgPaymentInfo >>> UpdateOrgPaymentInfoController: ${error.message}`);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Internal server error',
      });
    }
  }
}

