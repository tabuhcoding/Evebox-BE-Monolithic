import { ApiProperty } from '@nestjs/swagger';
import { BookingTicketType } from 'src/services/booking-svc/repository/order/order.repo';
import { PaymentMethod } from 'src/services/payment-svc/repository/paymentMethodStatus/paymentMethodStatus.repo';
import { OrderStatus } from './getUserOrder.dto';
import { Pagination } from 'src/shared/constants/pagination';
import { VerifyPinData } from 'src/services/auth-svc/modules/user/commands/verift-pin/verify-pin.dto';
import { BaseResponse } from 'src/shared/constants/baseResponse';

export class PreviewShowingDto {
  @ApiProperty( {example: 'The Batman', description: 'The title of the event' })
  title: string;

  @ApiProperty( {example: 'Nhà hát kịch Idecaf', description: 'The venue of the event' })
  venue: string;

  @ApiProperty( {example: '130 Nguyen Dinh Chieu, Da Kao Ward, District 1, Ho Chi Minh City', description: 'The address of the event' })
  locationsString: string;

  @ApiProperty( {example: '2021-10-10T10:00:00Z', description: 'The start time of the showing' })
  startTime: Date;

  @ApiProperty( {example: '2021-10-10T12:00:00Z', description: 'The end time of the showing' })
  endTime: Date;

  // In detail
  
  @ApiProperty({ description: 'Image URL', example: 'https://example.com/image.jpg', })
  imageUrl?: string;
}

export class UserFormAnserDto {
  @ApiProperty( {example: 'name', description: 'The field name of the form input' })
  fieldName: string;

  @ApiProperty( {example: 'Duong Ngoc Thai Bao', description: 'The value of the form answer' })
  value: string;
}

class UserPaymentInfoDto {
  @ApiProperty( {example: PaymentMethod.PAYOS, description: 'The payment method' })
  method: PaymentMethod;

  @ApiProperty( {example: '2021-10-10T10:00:00Z', description: 'The payment time' })
  paidAt: Date;
}

class TicketDto {
  @ApiProperty( {example: '12345678-1234-1234-1234-123456789012', description: 'The id of the ticket' })
  id: string;

  @ApiProperty( {example: 'L8', description: 'The seat number of the ticket' })
  seatname?: string;
  
  @ApiProperty( {example: 'Section A', description: 'The section name of the ticket' })
  sectionname?: string;  

  // Details
  
  @ApiProperty( {example: 'VIP Seat', description: 'The description of the ticket type' })
  description?: string;

  @ApiProperty( {example: 'asjdskdsdj', description: 'The QR code of the ticket' })
  qrcode?: string;
}

export class TicketWithTicketTypeDto {
  @ApiProperty( {example: '12345678-1234-1234-1234-123456789012', description: 'The id of the ticket type' })
  id: string;
  
  @ApiProperty( {example: 'VIP Seat', description: 'The type of the ticket' })
  name: string;

  @ApiProperty( {example: 'This is a VIP seat with extra legroom',  description: 'The description of the ticket type' })
  description: string;

  @ApiProperty( {example: 500000, description: 'The price of the ticket type' })
  price: number;

  @ApiProperty( {type: [TicketDto], description: 'The tickets of the ticket type' })
  tickets: TicketDto[];
}

export class UserOrderDto {
  @ApiProperty( {example: '36-b8343b4c64de', description: 'The id of the ticket' })
  id: string;

  @ApiProperty( {example: '169898227', description: 'The showing id of the order' })
  showingId: string;

  @ApiProperty( {example: OrderStatus.SUCCESS, description: 'The status of the order' })
  status: OrderStatus;

  @ApiProperty({ example: 'dattruong01082@gmail.com', description: 'User email now owns the order' })
  ownerId: string;

  @ApiProperty( {example: true, description: 'Has able to give away'})
  canGiveAway?: boolean;

  @ApiProperty( {example: BookingTicketType.E_TICKET, description: 'Type of order' })
  type: BookingTicketType;

  @ApiProperty( {example: 540000, description: 'The price of the order' })
  price: number;

  @ApiProperty( {example: '2023-10-01T12:00:00Z', description: 'The creation time of the order' })
  createdAt?: Date;

  @ApiProperty( {type: UserPaymentInfoDto, description: 'The payment info of the order' })
  PaymentInfo?: UserPaymentInfoDto;

  @ApiProperty( {type: [TicketWithTicketTypeDto], description: 'The tickets of the order' })
  Ticket?: TicketWithTicketTypeDto[];

  @ApiProperty( {type: PreviewShowingDto, description: 'The showing of the order' })
  Showing?: PreviewShowingDto;

  @ApiProperty( {example: 2, description: 'The number of tickets' })
  count?: number;

  // Details
  @ApiProperty( {type: [UserFormAnserDto], description: 'The form response of the ticket' })
  formResponse?: UserFormAnserDto[];
}

export class GetUserTicketResponseDto extends BaseResponse {
  @ApiProperty({ type: [UserOrderDto], description: 'The order data' })
  data: UserOrderDto[];

  @ApiProperty({ type: Object, description: 'Pagination data', required: false })
  pagination?: Pagination;
}

export class GetUserOrderByOriginalIdResponseDto extends BaseResponse {
  @ApiProperty({ type: UserOrderDto, description: 'The order data' })
  data: UserOrderDto;
}