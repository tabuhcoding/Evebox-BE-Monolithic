import { Inject, Injectable } from "@nestjs/common";
import { Result, Ok, Err } from "oxide.ts";
import { SlackService } from "src/infrastructure/adapters/slack/slack.service";
import { PaymentInfo, PaymentInfoRepository } from "src/services/payment-svc/repository/paymentInfo/paymentInfo.repo";

@Injectable()
export class GetPaymentInfoService {
  constructor(
    @Inject('PaymentInfoRepository') private readonly paymentInfoRepository: PaymentInfoRepository,
    private readonly slackService: SlackService,
  ) {}

  async execute(id: number): Promise<Result<PaymentInfo, Error>> {
    try {
      const paymentInfo = await this.paymentInfoRepository.findOneById(id);
      
      if (!paymentInfo) {
        return Err(null);
      }

      return Ok(paymentInfo);
    } catch (error) {
      console.error("🚀 ~ GetPaymentInfoService ~ execute ~ error:", error)
      await this.slackService.sendError(` Payment Svc >>> GetPaymentInfoService : ${error.message}`)

      return Err(null);
    }
  }

  async executeMany(ids: number[]): Promise<Result<Map<number, PaymentInfo>, Error>> {
    try {
      const paymentInfos = await this.paymentInfoRepository.findMany({
        id: { in: ids }
      });

      // Filter out null responses
      const paymentInfoMap = new Map<number, PaymentInfo>();
      paymentInfos.forEach(paymentInfo => {
        if (paymentInfo) {
          paymentInfoMap.set(paymentInfo.orderId, paymentInfo);
        }
      });
      return Ok(paymentInfoMap);
    } catch (error) {
      console.error("🚀 ~ GetPaymentInfoService ~ executeMany ~ error:", error);
      await this.slackService.sendError(` Payment Svc >>> GetPaymentInfoService : ${error.message}`);
      return Err(new Error('Failed to retrieve payment information'));
    }
  }

  async getPaymentInfoByOrderId(orderId: number): Promise<PaymentInfo | null> {
    try {
      const paymentInfo = await this.paymentInfoRepository.findOne({
        orderId: orderId,
        paidAt: {
          not: null,
        }
      });

      return paymentInfo || null;
    } catch (error) {
      await this.slackService.sendError(` Payment Svc >>> GetPaymentInfoService : ${error.message}`);
      
      return null;
    }
  }

  async  createPaymentInfo(orderId: number, date: Date): Promise<number> {
    return await this.paymentInfoRepository.insertOneWithNumberId({
      orderId: orderId,
      paidAt: date,
      method: 'PAYOS',
      paymentCode: orderId
    });
  }
}