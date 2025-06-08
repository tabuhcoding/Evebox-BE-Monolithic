import { Inject, Injectable } from "@nestjs/common";
import { Result, Ok, Err } from "oxide.ts";
import { SlackService } from "src/infrastructure/adapters/slack/slack.service";
import { PaymentInfoRepository } from "src/services/payment-svc/repository/paymentInfo/paymentInfo.repo";

@Injectable()
export class GetPaymentInfoService {
  constructor(
    @Inject('PaymentInfoRepository') private readonly paymentInfoRepository: PaymentInfoRepository,
    private readonly slackService: SlackService,
  ) {}

  async execute(id: number): Promise<Result<any, Error>> {
    try {
      const paymentInfo = await this.paymentInfoRepository.findOneById(id);
      
      if (!paymentInfo) {
        return Err(null);
      }

      return Ok(paymentInfo);
    } catch (error) {
      console.error("🚀 ~ GetPaymentInfoService ~ execute ~ error:", error)
      this.slackService.sendError(` Payment Svc >>> GetPaymentInfoService : ${error.message}`)

      return Err(null);
    }
  }
}