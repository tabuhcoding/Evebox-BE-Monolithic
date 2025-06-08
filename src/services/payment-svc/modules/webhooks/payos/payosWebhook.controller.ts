import { Controller, Get, Query, Res, HttpStatus, Post, Body, Headers } from '@nestjs/common';
import { Response } from 'express';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ErrorHandler } from 'src/shared/exceptions/error.handler';
import { SlackService } from 'src/infrastructure/adapters/slack/slack.service';

@ApiTags('Payment Service')
@Controller('api/payment')
export class GetPaymentMethodController {
  constructor(
    private readonly slackService: SlackService,
  ) {}

  @Post('/webhooks/payos')
  async getPayOSReturn(
    @Body() payload: any,
    @Headers('x-payos-signature') signature: string,
  ) {

    
  }
}