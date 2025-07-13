import { ApiBearerAuth, ApiBody, ApiHeader, ApiOperation, ApiProperty, ApiQuery, ApiResponse, ApiTags } from "@nestjs/swagger";
import { SlackService } from "src/infrastructure/adapters/slack/slack.service";
import { GenerateQrcodeService } from "../generateQrcode/generateQrcode.service";
import { Controller,Headers, HttpStatus, Param, Post, Res, UseGuards, Request, Query, Body } from "@nestjs/common";
import { JwtAuthGuard } from "src/shared/guard/jwt-auth.guard";
import { Response } from "express";
import { GiveTicketService } from "./giveTicket.service";

class GiveTicketDto {
    @ApiProperty({
        description: 'Order ID of the ticket to be given',
        example: 'some-order-id',
    })
    orderId: string;

    @ApiProperty({
        description: 'Email of the user to whom the ticket is given',
        example: 'recipient@example.com',
    })
    sendTo: string;
}

@ApiTags('Booking Service - Booking - GiveAway')
@Controller('api/booking')
export class GiveTicketController {
    constructor(
        private readonly giveTicketService: GiveTicketService,
        private readonly slackService: SlackService,
    ) {}

    @UseGuards(JwtAuthGuard)
    @Post('/give-ticket')
    @ApiBearerAuth('access-token')
    @ApiOperation({ summary: 'Give ticket to another user' })
    @ApiBody({
        description: 'Order ID and email of the user to whom the ticket is given',
        type: GiveTicketDto,
        schema: {
            example: {
                orderId: 'some-order-id',
                sendTo: 'recipient@example.com',
            },
        },
    })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Ticket given successfully',
        type: Boolean,
    })
    @ApiResponse({
        status: HttpStatus.BAD_REQUEST,
        description: 'Invalid input or order not found',
    })
    @ApiResponse({
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        description: 'Internal server error',
    })
    async giveTicket(
        @Body() dto: { orderId: string; sendTo: string },
        @Request() req, 
        @Res() res: Response
    ) {
        try {
            const user = req.user;
            const result = await this.giveTicketService.giveTicket(dto.orderId, user.email, dto.sendTo);

            if (!result) {
                return res.status(HttpStatus.BAD_REQUEST).json({
                    statusCode: HttpStatus.BAD_REQUEST,
                    message: 'Failed to give ticket',
                });
            }

            return res.status(HttpStatus.OK).json({
                statusCode: HttpStatus.OK,
                message: 'Ticket given successfully',
                data: true,
            });
        } catch (error) {
            console.error(error);
            await this.slackService.sendError(`Booking Svc >>> GiveTicketController : ${error.message}`);
            return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
                statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
                message: 'Internal server error',
            });
        }
    }

    @Post('/receive-ticket')
    @ApiHeader({ name: 'x-send-key', description: 'The send key for ticket receiving' })
    @ApiOperation({ summary: 'Receive ticket using send key' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Ticket received successfully',
        type: Boolean,
    })
    @ApiResponse({
        status: HttpStatus.BAD_REQUEST,
        description: 'Invalid send key or order not found',
    })
    @ApiResponse({
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        description: 'Internal server error',
    })
    async receiveTicket(
        @Headers('x-send-key') sendKey: string,
        @Res() res: Response
    ) {
        if (!sendKey) {
            return res.status(HttpStatus.UNAUTHORIZED).json({
                statusCode: HttpStatus.BAD_REQUEST,
                message: 'Send key is required',
            });
        }
        try {
            const result = await this.giveTicketService.receiveTicket(sendKey);

            if (!result) {
                return res.status(HttpStatus.BAD_REQUEST).json({
                    statusCode: HttpStatus.BAD_REQUEST,
                    message: 'Failed to receive ticket',
                });
            }

            return res.status(HttpStatus.OK).json({
                statusCode: HttpStatus.OK,
                message: 'Ticket received successfully',
                data: true,
            });
        } catch (error) {
            console.error(error);
            await this.slackService.sendError(`Booking Svc >>> GiveTicketController : ${error.message}`);
            return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
                statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
                message: 'Internal server error',
            });
        }
    }
}