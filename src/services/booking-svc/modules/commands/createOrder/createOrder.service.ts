import { Inject, Injectable } from "@nestjs/common";
import { SlackService } from "src/infrastructure/adapters/slack/slack.service";
import { Order, OrderRepository } from "src/services/booking-svc/repository/order/order.repo";
import { GetUserSubmitFormService } from "src/services/event-svc/modules/form/queries/getUserSubmitForm/getUserSubmitForm.service";
import { BookingTicketStatus, BookingTicketType } from "src/services/booking-svc/repository/order/order.repo";

@Injectable()
export class CreateOrderService {
  constructor(
    @Inject('OrderRepository') private readonly orderRepository: OrderRepository, // Replace 'any' with the actual type of OrderRepository
    private readonly slackService: SlackService,
    private readonly getUserSubmitFormService: GetUserSubmitFormService,
  ) {}

  async execue(showingID: string, totalPrice: number, userID: string): Promise<number | null> {
    try{
      const formResponseId = await this.getUserSubmitFormService.execute(showingID, userID); // Replace 'userID' with actual user ID
      // TODO: Uncomment the following line after implementing SubmitFormService
      if (!formResponseId) {

        return null;
      }

      const order = await this.orderRepository.insertOneWithNumberId({
        showingId: showingID,
        price: totalPrice,
        totalPrice: totalPrice,
        formResponseId: formResponseId,
        type: BookingTicketType.E_TICKET,
        userId: userID,
        status: totalPrice > 0 ? BookingTicketStatus.PENDING : BookingTicketStatus.SUCCESS,
      });

      if (!order) {
        await this.slackService.sendError(` Booking Svc >>> createOrder : Failed to create order for showingID: ${showingID} and userID: ${userID}`);

        return null;
      }

      await this.slackService.sendNotice(` Booking Svc >>> createOrder : Order created successfully for showingID: ${showingID} and userID: ${userID} with order ID: ${order}`);
      return order
    }
    catch (error) {
      await this.slackService.sendError(` Booking Svc >>> getTotalTicketOfTicketType : ${error.message}`)

      return null;
    }
  }

  async updateOrderStatus(orderId: number, status: BookingTicketStatus): Promise<Order | null> {
    try {
      const order = await this.orderRepository.updateAndFindOneById(orderId, { status });
      
      return order;
    } catch (error) {
      await this.slackService.sendError(` Booking Svc >>> updateOrderStatus : ${error.message}`);
      
      return null;
    }
  }
}