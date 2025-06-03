import { Controller, Get, Request, Res, HttpStatus, UseGuards } from "@nestjs/common";
import { Response } from "express";
import { ApiOperation, ApiResponse, ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from "src/shared/guard/jwt-auth.guard";
import { GetOrgPaymentInfoService } from "./getOrgPaymentInfor.service";
import { GetOrgPaymentInfoResponseDto } from "./getOrgPaymentInfor-response.dto";
import { SlackService } from "src/infrastructure/adapters/slack/slack.service";

@ApiTags('Event Service - Organizer - Payment Info')
@Controller('api/org/payment')
export class GetOrgPaymentInfoController {
  constructor(
    private readonly getOrgPaymentInfoService: GetOrgPaymentInfoService,
    private readonly slackService: SlackService
  ) { }

  @UseGuards(JwtAuthGuard)
  @Get('/')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get OrgPaymentInfo by organizerId' })
  @ApiResponse({ status: HttpStatus.OK, description: 'OrgPaymentInfo retrieved successfully', type: GetOrgPaymentInfoResponseDto })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Internal server error' })
  async getOrgPaymentInfo(
    @Request() req,
    @Res() res: Response
  ) {
    try {
      const email = req.user?.email;
      if (!email) {
        return res.status(HttpStatus.UNAUTHORIZED).json({
          statusCode: HttpStatus.UNAUTHORIZED,
          message: 'Unauthorized',
        });
      }

      const result = await this.getOrgPaymentInfoService.execute(email);
      if (result.isErr()) {
        return res.status(HttpStatus.BAD_REQUEST).json({
          statusCode: HttpStatus.BAD_REQUEST,
          message: result.unwrapErr().message,
        });
      }
      return res.status(HttpStatus.OK).json({
        statusCode: HttpStatus.OK,
        message: 'OrgPaymentInfo retrieved successfully',
        data: result.unwrap(),
      });
    } catch (error) {
      this.slackService.sendError(`Event Service - OrgPaymentInfo >>> GetOrgPaymentInfoController: ${error.message}`);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Internal server error',
      });
    }
  }
}