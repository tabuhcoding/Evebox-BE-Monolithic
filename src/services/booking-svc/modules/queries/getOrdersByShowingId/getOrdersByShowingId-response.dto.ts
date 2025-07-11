import { ApiProperty } from '@nestjs/swagger';
import { JsonValue } from '@prisma/client/runtime/library';
import { BaseResponse } from 'src/shared/constants/baseResponse';
import { BookingTicketStatus, BookingTicketType } from 'src/services/booking-svc/repository/order/order.repo';
import { PaymentMethod } from 'src/services/payment-svc/repository/paymentMethodStatus/paymentMethodStatus.repo';
import { TicketWithTicketTypeDto } from '../getUserOrder/getUserOrder-response.dto';
import { Pagination } from 'src/shared/constants/pagination';
import { Ticket } from 'src/services/booking-svc/repository/ticket/ticket.repo';


class FormInput {
  @ApiProperty({ example: 'Full Name', description: 'Field name of the form input' })
  fieldName: string;

  @ApiProperty({ example: '', description: 'Options available for the input field', required: false })
  options?: JsonValue;
}

class FormAnswer {
  @ApiProperty({ example: 'John Doe', description: 'Answer value submitted by the user' })
  value: string;

  @ApiProperty({ type: FormInput, description: 'Corresponding input field for the answer' })
  FormInput: FormInput;
}

class FormResponse {
  @ApiProperty({ type: [FormAnswer], description: 'All answers submitted in the form' })
  FormAnswer: FormAnswer[];
}

class PaymentInfo {
  @ApiProperty({ example: 1032, description: 'Payment info ID' })
  id: number;

  @ApiProperty( {example: PaymentMethod.PAYOS, description: 'The payment method' })
  method: PaymentMethod;

  @ApiProperty( {example: '2021-10-10T10:00:00Z', description: 'The payment time' })
  paidAt: Date;
}

class TicketDto {
  @ApiProperty( {example: '12345678-1234-1234-1234-123456789012', description: 'The id of the ticket' })
  id: string;

  @ApiProperty( {example: 'L8', description: 'The seat number of the ticket' })
  seatID?: number;
  
  @ApiProperty( {example: 'Section A', description: 'The section name of the ticket' })
  sectionID?: number;  

  // Details
  
  @ApiProperty( {example: 'asdhjksahdak', description: 'The qrcode of the ticket' })
  qrCode?: string;
  
  @ApiProperty( {example: 'VIP Seat', description: 'The description of the ticket type' })
  description?: string;
}

export class TicketGroupedByTicketTypeID {
  @ApiProperty( {example: '12345678-1234-1234-1234-123456789012', description: 'The id of the ticket type' })
  id: string;

  @ApiProperty( {type: [TicketDto], description: 'The tickets of the ticket type' })
  tickets: TicketDto[];

  @ApiProperty( { example: 30, description: 'The total ticket sale of the ticket type' })
  totalSales?: number;
}

export class OrderData {
  @ApiProperty( {example: 248558, description: 'The id of the ticket' })
  id: number;

  @ApiProperty( {example: '169898227', description: 'The showing id of the order' })
  showingId: string;

  @ApiProperty( {example: BookingTicketStatus.PAID, description: 'The status of the order' })
  status: BookingTicketStatus;

  @ApiProperty( {example: BookingTicketType.E_TICKET, description: 'Type of order' })
  type: BookingTicketType;

  @ApiProperty( {example: 540000, description: 'The price of the order' })
  price: number;

  @ApiProperty({ example: true, description: 'Whether the order confirmation mail was sent' })
  mailSent: boolean;

  @ApiProperty({ example: 'dattruong01082@gmail.com', description: 'User email associated with the order' })
  userId: string;

  @ApiProperty({ type: FormResponse, description: 'Form responses attached to the order', required: false })
  formResponse?: FormResponse;

  @ApiProperty({ type: PaymentInfo, description: 'Payment information associated with the order', required: false })
  paymentInfo?: PaymentInfo;

  // @ApiProperty( {type: [TicketGroupedByTicketTypeID], description: 'The tickets of the order' })
  // Ticket?: TicketGroupedByTicketTypeID[];

  @ApiProperty({ example: '2023-10-01T12:00:00Z', description: 'The time when the order was created' })
  createdAt: Date;

  @ApiProperty({ example: 2, description: 'Total number of tickets in the order' })
  totalTicket: number;
}

export class GetOrdersResponse extends BaseResponse {
  @ApiProperty({ type: [OrderData], description: 'List of all tickets/orders of the showing' })
  data: OrderData[];

  @ApiProperty({ type: Pagination, description: 'Pagination information' })
  pagination?: Pagination;
}

export class GetTicketsResponse extends BaseResponse {
  @ApiProperty({ description: 'List of all tickets of the showing' })
  data: Ticket[];

  @ApiProperty({ type: Pagination, description: 'Pagination information' })
  pagination?: Pagination;
}
