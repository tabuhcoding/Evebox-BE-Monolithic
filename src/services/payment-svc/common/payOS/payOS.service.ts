import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import PayOS from '@payos/node';
import { CheckoutRequestType } from '@payos/node/lib/type';
import { ConfigService } from '@nestjs/config';
import { SlackService } from 'src/infrastructure/adapters/slack/slack.service';

@Injectable()
export class PayOSService implements OnModuleInit, OnModuleDestroy {
  private payOS: PayOS;

  constructor( 
    private readonly configService: ConfigService,
    private readonly slackService: SlackService
  ) {
    this.payOS = new PayOS(
      this.configService.get<string>('PAYOS_CLIENT_ID'), // API Key
      this.configService.get<string>('PAYOS_API_KEY'), // Secret Key
      this.configService.get<string>('PAYOS_CHECKSUM_KEY') // Checksum Key
    );
  }

  onModuleInit() {
    this.slackService.sendNotice(`PayOSService initialized with Client ID: ${this.configService.get<string>('PAYOS_CLIENT_ID')}`);
  }

  onModuleDestroy() {
    this.slackService.sendNotice(`PayOSService destroyed`);
  }

  async createPaymentLink(body: CheckoutRequestType) {
    return await this.payOS.createPaymentLink(body);
  }

  async getPaymentLinkInformation(id: string) {
    return await this.payOS.getPaymentLinkInformation(id);
  }

  async cancelPaymentLink(id: string, reason: string) {
    return await this.payOS.cancelPaymentLink(id, reason);
  }
}
