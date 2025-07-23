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
import { FindUserByEmailService } from 'src/services/auth-svc/modules/user/commands/find-user-by-email/findUserByEmail.service';
import { InternalSaveUserService } from 'src/services/auth-svc/modules/user/commands/internal-save-user/internal-save-user.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UserRole } from 'src/services/auth-svc/modules/user/domain/enums/user-role.enum';
import { Name } from 'src/services/auth-svc/modules/user/domain/value-objects/user/name.vo';
import { Email } from 'src/services/auth-svc/modules/user/domain/value-objects/user/email.vo';
import { Password } from 'src/services/auth-svc/modules/user/domain/value-objects/user/password.vo';
import { Phone } from 'src/services/auth-svc/modules/user/domain/value-objects/user/phone.vo';
import { User } from 'src/services/auth-svc/modules/user/domain/entities/user.entity';

@Injectable()
export class GiveTicketService {
    private hashids: Hashids;

    constructor(
        @Inject('OrderRepository') private readonly orderRepository: OrderRepository,
        @Inject('TicketRepository') private readonly ticketRepository: TicketRepository,
        // private readonly checkUserExistService: CheckUserExistService,
        private readonly slackService: SlackService,
        private readonly emailService: EmailService,
        private readonly getPreviewShowingService: GetPreviewShowingService,
        private readonly sendEmailService: GenerateQrcodeService,
        private readonly findUserByEmailService: FindUserByEmailService,
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService,
        private readonly internalSaveUserService: InternalSaveUserService,
    ) {
        this.hashids = new Hashids('evebox-salt', 12);
    }

    async giveTicket(orderId: string, email: string, sendTo: string): Promise<boolean> {
        try {
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

            if (order.ownerId && order.ownerId === sendTo
                || (!order.ownerId && order.userId === sendTo)
            ) {
                throw new Error('You cannot give the ticket to yourself');
            }

            if (order.Ticket.some(ticket => ticket.isCheckedIn)) {
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

    async receiveTicket(sendKey: string): Promise<
        | { success: true; email: string, access_token: string; refresh_token: string; id: string }
        | { success: false }
    > {
        try {
            const order = await this.orderRepository.findOne({ sendKey }, { Ticket: true });

            if (!order) throw new Error('Order not found for the provided sendKey');

            const showing = await this.getPreviewShowingService.execute(order.showingId);
            if (!showing || new Date(showing.endTime) < new Date()) {
                throw new Error('Showing not found or has ended');
            }

            if (order.Ticket.some(ticket => ticket.isCheckedIn)) {
                throw new Error('Cannot receive ticket that has been checked in');
            }

            const { email, key, time } = decrypt(sendKey);

            const sendTime = new Date(time);
            const hoursDiff = (Date.now() - sendTime.getTime()) / (1000 * 60 * 60);
            if (hoursDiff > 48) throw new Error('Ticket has expired');

            // Check user exists or create new
            let user = await this.findUserByEmailService.execute(email);
            if (!user) {
                const name = email.split('@')[0];
                const nameOrError = Name.create(name.replace(/[._-]/g, ' '));
                const emailOrError = Email.create(email);
                const passwordOrError = await Password.create('receive-ticket');
                const phoneOrError = Phone.create('0123456789');

                if (nameOrError.isErr() || emailOrError.isErr() || passwordOrError.isErr() || phoneOrError.isErr()) {
                    throw new Error('Invalid user data when creating new user');
                }

                const userOrError = await User.createNew(
                    nameOrError.unwrap(),
                    emailOrError.unwrap(),
                    passwordOrError.unwrap(),
                    phoneOrError.unwrap(),
                    [],
                    UserRole.CUSTOMER,
                );

                if (userOrError.isErr()) {
                    throw new Error('Failed to create user');
                }

                await this.internalSaveUserService.saveUser(userOrError.unwrap());
                user = await this.findUserByEmailService.execute(email);
                if (!user) throw new Error('Failed to find user after creation');
            }

            const payload = { email: user.email.value, role: user.role.getValue() };
            const accessToken = this.jwtService.sign(payload);
            const refreshToken = this.jwtService.sign(payload, {
                expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRES_IN'),
                secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
            });

            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + 7);
            await this.internalSaveUserService.saveRefreshToken(refreshToken, user.email.value, expiresAt);

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
            if (!emailSent) throw new Error('Send ticket email failed');

            await this.emailService.sendConfirmMessageWhenReceived(order.userId, order.id, order.ownerId);

            return {
                success: true,
                access_token: accessToken,
                refresh_token: refreshToken,
                email: email,
                id: user.id.value,
            };
        } catch (e) {
            await this.slackService.sendError(`ReceiveTicket Error: ${e.message}`);
            return { success: false };
        }
    }

    decodeId(hash: string): number {
        const [id] = this.hashids.decode(hash) as number[];
        if (typeof id !== 'number') return null;
        return id;
    }
}