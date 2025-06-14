import { Controller, Post, Body, Request, UseGuards, HttpStatus, Res } from "@nestjs/common";
import { Response } from "express";
import { ApiBody, ApiOperation, ApiResponse, ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { JwtAuthGuard } from "src/shared/guard/jwt-auth.guard";
import { CreateOrgPaymentInfoService } from "./createOrgPaymentInfor.service";
import { CreateOrgPaymentInfoDto } from "./createOrgPaymentInfor.dto";
import { CreateOrgPaymentInfoResponseDto } from "./createOrgPaymentInfor-response.dto";
import { SlackService } from "src/infrastructure/adapters/slack/slack.service";

@ApiTags('Event Service - Organizer - Payment Info')
@Controller('api/org/payment') 
export class CreateOrgPaymentInfoController {
  constructor(
    private readonly createOrgPaymentInfoService: CreateOrgPaymentInfoService,
    private readonly slackService: SlackService
  ) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  @ApiBearerAuth('access-token')
  @ApiBody({ type: CreateOrgPaymentInfoDto })
  @ApiOperation({ summary: 'Create Org Payment Information' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'OrgPaymentInfo created successfully', type: CreateOrgPaymentInfoResponseDto })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Bad request' })
  async createPaymentInfo(
    @Request() req,
    @Body() createOrgPaymentInfoDto: CreateOrgPaymentInfoDto,
    @Res() res: Response,
  ) {
    try {
      // Use organizer id from token if needed
      const organizerId = req.user.email;
      if (!organizerId) {
        return res.status(HttpStatus.UNAUTHORIZED).json({
          statusCode: HttpStatus.UNAUTHORIZED,
          message: 'Unauthorized',
        });
      }
      const result = await this.createOrgPaymentInfoService.execute(createOrgPaymentInfoDto, organizerId);
      if (result.isErr()) {
        return res.status(HttpStatus.BAD_REQUEST).json({
          statusCode: HttpStatus.BAD_REQUEST,
          message: result.unwrapErr().message,
        });
      }
      return res.status(HttpStatus.CREATED).json({
        statusCode: HttpStatus.CREATED,
        message: 'OrgPaymentInfo created successfully',
        data: { id: result.unwrap() },
      });
    } catch (error) {
      await this.slackService.sendError(`EventSvc - OrgPaymentInfo >>> CreateOrgPaymentInfoController: ${error.message}`);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Internal server error',
      });
    }
  }
}