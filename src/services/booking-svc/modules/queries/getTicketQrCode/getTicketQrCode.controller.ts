import { Controller, Get, Query, Res, HttpStatus, UseGuards, Request } from '@nestjs/common';
import { ApiHeader, ApiOperation, ApiQuery, ApiResponse, ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { VerifyUserPinService } from "src/services/auth-svc/modules/user/commands/verift-pin/verify-pin.service";
import { GetTicketQrCodeService } from "./getTicketQrCode.service";
import { JwtAuthGuard } from "src/shared/guard/jwt-auth.guard";
import { Response } from 'express';
import { GetUserTicketResponseDto } from '../getUserOrder/getUserOrder-response.dto';
import { ErrorHandler } from 'src/shared/exceptions/error.handler';
import { VerifyUserPinCommand } from 'src/services/auth-svc/modules/user/commands/verift-pin/verify-pin.command';

@ApiTags('Booking Service - Booking')
@Controller('api/ticket')
export class GetTicketQrCodeController {
  constructor(
    private readonly verifyUserPinService: VerifyUserPinService,
    private readonly getTicketQrCodeService: GetTicketQrCodeService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Get('/getTicketQrCode')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get status of all payment method' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Ticket data retrieved successfully',
    type: GetUserTicketResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Internal server error',
  })
  async getTicketQrCode(
    @Request() req,
    @Res() res: Response,
    @Query('ticketId') ticketId: string,
    @Query('PIN') PIN: string,
  ) {
    const email = req.user.email;
    
    const pinVerificationResult = await this.verifyUserPinService.execute(new VerifyUserPinCommand(
      PIN,
      email,
    ));

    if (pinVerificationResult.isErr()) {
      return res
        .status(HttpStatus.BAD_REQUEST)
        .json(ErrorHandler.badRequest(pinVerificationResult.unwrapErr().message));
    }

    const pinVerification = pinVerificationResult.unwrap();
    if (!pinVerification.isValid) {
      if (pinVerification.lockedUntil) {
        return res.status(HttpStatus.FORBIDDEN).json({
          statusCode: HttpStatus.FORBIDDEN,
          message: `Account locked until ${pinVerification.lockedUntil}`,
          data: {
            pinVerification,
            qrCode: null
          }
        });
      } else {
        return res.status(HttpStatus.UNAUTHORIZED).json({
          statusCode: HttpStatus.UNAUTHORIZED,
          message: `Invalid PIN.  ${pinVerification.remainingAttempts} attempts remaining.`,
          data: {
            pinVerification,
            qrCode: null
          }
        });
      }
    }
    
    const result = await this.getTicketQrCodeService.getTicketQrCode(ticketId, email);
    if (result.isErr()) {
      return res
        .status(HttpStatus.BAD_REQUEST)
        .json(ErrorHandler.internalServerError(result.unwrapErr().message));
    }

    const data = result.unwrap();
    return res.status(HttpStatus.OK).json({
      statusCode: HttpStatus.OK,
      message: 'Order data retrieved successfully',
      data: {
        pinVerification,
        qrCode: data,
      },
    });
  }
}