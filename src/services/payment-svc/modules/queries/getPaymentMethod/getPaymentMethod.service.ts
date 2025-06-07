import { Inject, Injectable } from '@nestjs/common';
import { Result, Ok, Err } from 'oxide.ts';
import { getPaymentMethodResponseData } from './getPaymentMethod-response.dto';
import { PaymentMethodStatusRepository } from 'src/services/payment-svc/repository/paymentMethodStatus/paymentMethodStatus.repo';

@Injectable()
export class GetPaymentMethodService {
  constructor(
    @Inject('PaymentMethodStatusRepository') private readonly paymentMethodStatusRepository: PaymentMethodStatusRepository
  ) {}

  async execute(): Promise<Result<getPaymentMethodResponseData[], Error>> {
    try {
      const paymentMethods = await this.paymentMethodStatusRepository.findAll({});
  
      return Ok(paymentMethods);
    } catch (error) {
      console.error(error);
      return Err(new Error('Failed to fetch PaymentMethod data.'));
    }
  }

}