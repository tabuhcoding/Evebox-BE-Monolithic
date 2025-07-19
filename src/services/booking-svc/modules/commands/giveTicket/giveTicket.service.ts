import { decrypt, encrypt } from 'src/shared/utils/qrcode/utils';
import { CheckUserExistService } from './../../../../auth-svc/modules/user/commands/checkuserExist/checkuserExist.service';
import { Inject, Injectable } from "@nestjs/common";
import { SlackService } from 'src/infrastructure/adapters/slack/slack.service';
import { OrderRepository } from "src/services/booking-svc/repository/order/order.repo";
import { v4 } from 'uuid';
import { EmailService } from 'src/infrastructure/adapters/email/email.service';
import { GenerateQrcodeService } from '../generateQrcode/generateQrcode.service';
import Hashids from 'hashids';
import { TicketRepository } from 'src/services/booking-svc/repository/ticket/ticket.repo';
import { GetPreviewShowingService } from 'src/services/event-svc/modules/showing/queries/getPreviewShowing/getPreviewShowing.service';

@Injectable()
export class GiveTicketService {
    private hashids: Hashids;

    constructor(
        @Inject('OrderRepository') private readonly orderRepository: OrderRepository,
        @Inject('TicketRepository') private readonly ticketRepository: TicketRepository,
        private readonly checkUserExistService: CheckUserExistService,
        private readonly slackService: SlackService,
        private readonly emailService: EmailService,
            private readonly getPreviewShowingService: GetPreviewShowingService,
        private readonly sendEmailService: GenerateQrcodeService,
    ) {
        this.hashids = new Hashids('evebox-salt', 12);
    }

    async giveTicket(orderId: string, email: string, sendTo: string): Promise<boolean> {
        try{
            const id = this.decodeId(orderId);
            
            if (!id) {
                throw new Error(`Invalid orderId: ${orderId}`);
            }
            // Double check order
            const order = await this.orderRepository.findOneById(id, 
                {
                    Ticket: true,
                }
            );
            if (!order) {
                throw new Error(`Order not found for orderId: ${orderId}`);
            }

            // Check if the order is eligible for giving away
            if (order.status !== 'SUCCESS' 
                || (order.ownerId && order.ownerId !== email)
                || (order.userId && order.userId !== email)
            ) {
                throw new Error('Order is not eligible for giving away');
            }

            const userExists = await this.checkUserExistService.execute(sendTo);
            if (!userExists) {
                throw new Error(`User with email ${sendTo} does not exist`);
            }

            if (order.ownerId && order.ownerId === sendTo
            || (!order.ownerId && order.userId === sendTo)
            ) {
                throw new Error('You cannot give the ticket to yourself');
            }

            if (order.Ticket.some(ticket => ticket.isCheckedIn)){
                throw new Error('Cannot give away order that some ticket in order have already been checked in');
            }

            const showing = await this.getPreviewShowingService.execute(order.showingId);
            if (!showing || new Date(showing.endTime) < new Date()) {
                throw new Error('Showing not found or has ended');
            }

            const sendData = {
                email: sendTo,
                key: v4(),
                time: new Date().toISOString(),
            }

            const encryptedData = encrypt(JSON.stringify(sendData));
            await this.orderRepository.updateOneById(id, {
                sendKey: encryptedData,
            });

            await this.emailService.sendGiveAwayEmail([sendTo], email, encryptedData);
            return true;
        }
        catch (error) {
            await this.slackService.sendError(`GiveTicketService >>> Error giving ticket for order ID ${orderId}: ${error.message}`);
            return false;
        }
    }

    async receiveTicket(sendKey: string): Promise<boolean> {
        try {
            const order = await this.orderRepository.findOne({
                sendKey: sendKey,
            },
            {
                Ticket: true,
            })

            if (!order) {
                throw new Error('Order not found for the provided sendKey');
            }

            const showing = await this.getPreviewShowingService.execute(order.showingId);
            if (!showing || new Date(showing.endTime) < new Date()) {
                throw new Error('Showing not found or has ended');
            }

            if (order.Ticket.some(ticket => ticket.isCheckedIn)) {
                throw new Error('Cannot receive ticket that some ticket in order have already been checked in');
            }

            const decryptedData = (decrypt(sendKey));
            const { email, key, time } = decryptedData;

            //  validate time, if more than 48 hours, return false
            const currentTime = new Date();
            const sendTime = new Date(time);
            const timeDifference = currentTime.getTime() - sendTime.getTime();
            const hoursDifference = timeDifference / (1000 * 60 * 60); 
            if (hoursDifference > 48) {
                throw new Error('The ticket has expired, please contact the organizer');
            }

            // Process the ticket reception (e.g., update the order status)
            await this.orderRepository.updateOneById(order.id, {
                ownerId: email,
                sendKey: null,
                mailSent: false,
            });

            for (const ticket of order.Ticket) {
                await this.ticketRepository.updateOneById(ticket.id, {
                    qrCode: `${ticket.id}-${v4()}`,
                });
            }

            const emailSent = await this.sendEmailService.sendTicketEmailToUser([order.id]);
            if (!emailSent) {
                await this.orderRepository.updateOneById(order.id, {
                    ownerId: order.ownerId,
                    sendKey: order.sendKey,
                    mailSent: order.mailSent,
                });
                for (const ticket of order.Ticket) {
                    await this.ticketRepository.updateOneById(ticket.id, {
                        qrCode: ticket.qrCode,
                    });
                }
                throw new Error('Failed to receive ticket email, try again later');
            }
            await this.emailService.sendConfirmMessageWhenReceived(order.userId, order.id, order.ownerId);

            return true;
        } catch (error) {
            return false;
        }
    }
    decodeId(hash: string): number {
        const [id] = this.hashids.decode(hash) as number[];
        if (typeof id !== 'number') return null;
        return id;
    }
}