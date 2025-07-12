import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from "@nestjs/swagger";
import { SlackService } from "src/infrastructure/adapters/slack/slack.service";
import { GenerateQrcodeService } from "../generateQrcode/generateQrcode.service";
import { Controller, HttpStatus, Param, Post, Res, UseGuards, Request, Query } from "@nestjs/common";
import { JwtAuthGuard } from "src/shared/guard/jwt-auth.guard";
import { Response } from "express";
import { CheckUserExistService } from "src/services/auth-svc/modules/user/commands/checkuserExist/checkuserExist.service";

@ApiTags('Booking Service - Booking')
@Controller('api/booking')
export class SendEmailController {
    constructor(
        private readonly sendEmailService: GenerateQrcodeService,
        private readonly slackService: SlackService,
        private readonly checkAdminExist: CheckUserExistService
    ) {}

    @UseGuards(JwtAuthGuard)
    @Post('/sendEmail')
    @ApiBearerAuth('access-token')
    @ApiOperation({ summary: 'Send ticket email to user' })
    @ApiQuery({ name: 'orderId', required: true, type: [Number], description: 'Order IDs to send email' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Email sent successfully',
        type: Object,
        schema: {
            example: {
                statusCode: HttpStatus.OK,
                message: 'Email sent successfully',
                data: true,
            },
        },
    })
    @ApiResponse({
        status: HttpStatus.BAD_REQUEST,
        description: 'Invalid order ID',
    })
    @ApiResponse({
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        description: 'Internal server error',
    })
    async sendEmail(
        @Request() req,
        @Query('orderId') orderIds: number[],
        @Res() res: Response,
    ) {
        try {
            orderIds = Array.isArray(orderIds) ? orderIds : [orderIds];
            if (!Array.isArray(orderIds) || orderIds.length === 0) {
                return res.status(HttpStatus.BAD_REQUEST).json({
                    statusCode: HttpStatus.BAD_REQUEST,
                    message: 'Invalid order ID',
                });
            }
            const result = await this.sendEmailService.sendTicketEmailToUser(
                orderIds.map(id => id >> 0),
            );
            if (!result) {
                return res.status(HttpStatus.BAD_REQUEST).json({
                    statusCode: HttpStatus.BAD_REQUEST,
                    message: 'Failed to send email',
                });
            }

            return res.status(HttpStatus.OK).json({
                statusCode: HttpStatus.OK,
                message: 'Email sent successfully',
                data: result
            });
        } catch (error) {
            await this.slackService.sendError(`Booking Svc >>> sendEmail : Error sending email for orderId: ${orderIds}, Error: ${error.message}`);
            return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
                statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
                message: 'Internal server error',
            });
        }
    }
}