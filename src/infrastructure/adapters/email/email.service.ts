// backend/src/infrastructure/adapters/email/email.service.ts

import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { PreviewShowingDto, UserOrderDto } from 'src/services/booking-svc/modules/queries/getUserOrder/getUserOrder-response.dto';
import { CreateEventDto } from 'src/services/event-svc/modules/event/commands/createEvent/createEvent.dto';
import { EventFrontDisplayDto } from 'src/services/event-svc/modules/event/queries/getEventFrontDisplay/getEventFrontDisplay-response.dto';

@Injectable()
export class EmailService implements OnModuleInit {
  private transporter: nodemailer.Transporter;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('EMAIL_HOST'),
      port: this.configService.get<number>('EMAIL_PORT', 587),
      secure: false, // true for 465, false for other ports
      auth: {
        user: this.configService.get<string>('EMAIL_USERNAME'),
        pass: this.configService.get<string>('EMAIL_PASS'),
      },
    });
  }

  async sendWelcomeEmail(to: string): Promise<void> {
    const mailOptions: nodemailer.SendMailOptions = {
      from: `"EveBox" <${this.configService.get<string>('EMAIL_USER', 'hello@evebox.studio')}>`,
      to,
      subject: 'Welcome to EveBox!',
      text: 'Thank you for registering with us.',
      html: '<b>Thank you for registering with us.</b>',
    };
    
    console.log("Send email to: ", to);
    await this.transporter.sendMail(mailOptions);
  }

  // async sendForgotPassword(to: string): Promise<void> {
  //   const mailOptions: nodemailer.SendMailOptions = {
  //     from: `"EveBox" <${this.configService.get<string>('EMAIL_USER', 'hello@evebox.studio')}>`,
  //     to,
  //     subject: 'EveBox - Forgot Password!',
  //     text: 'Thank you for registering with us.',
  //     html: '<b>Thank you for registering with us.</b>',
  //   };
    
  //   console.log("Send email to: ", to);
  //   await this.transporter.sendMail(mailOptions);
  // }

  async sendRoleAssignedEmail(to: string, role: string): Promise<void> {
    const mailOptions: nodemailer.SendMailOptions = {
      from: `"EveBox" <${this.configService.get<string>('EMAIL_USER', 'hello@evebox.studio')}>`,
      to,
      subject: 'Your Role Has Been Updated',
      text: `Your role has been updated to ${role}.`,
      html: `<b>Your role has been updated to ${role}.</b>`,
    };

    await this.transporter.sendMail(mailOptions);
  }

  async sendOTPEmail(email: string, otp: string, type: string): Promise<void> {
    console.log("send otp email: ", email, otp, type);
    const appName = this.configService.get<string>('APP_NAME', 'EveBox');
    switch (type) {
      case 'FORGOT_PASSWORD':
        try {
          await this.transporter.sendMail({
            from: `"${appName}" <${this.configService.get<string>('EMAIL_USER', 'hello@evebox.studio')}>`,
            to: email,
            subject: `${appName} - Password Reset OTP`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2>Password Reset Request</h2>
                <p>You have requested to reset your password. Please use the following OTP code to proceed:</p>
                <div style="background-color: #f4f4f4; padding: 15px; text-align: center; font-size: 24px; letter-spacing: 5px; margin: 20px 0;">
                  <strong>${otp}</strong>
                </div>
                <p>This OTP will expire in 15 minutes.</p>
                <p>If you didn't request this password reset, please ignore this email or contact support if you have concerns.</p>
                <p>Best regards,<br>${appName} Team</p>
              </div>
            `,
          });
        } catch (error) {
          console.error('Failed to send OTP email:', error);
          throw new Error('Failed to send OTP email');
        }
        break;
        
      case 'REGISTER':
        try {
          await this.transporter.sendMail({
            from: `"${appName}" <${this.configService.get<string>('EMAIL_USER', 'hello@evebox.studio')}>`,
            to: email,
            subject: `${appName} - Registration OTP`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff; border: 1px solid #eaeaea; border-radius: 10px;">
                <h2 style="color: #333333; text-align: center;">Welcome to ${appName}!</h2>
                <p style="color: #333333; font-size: 16px;">Thank you for registering with us. Please use the OTP code below to complete your registration:</p>
                <div style="background-color: #f9f9f9; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 2px; margin: 20px 0; border: 1px solid #eaeaea; border-radius: 5px;">
                  ${otp}
                </div>
                <p style="color: #333333; font-size: 14px;">This OTP will expire in <strong>15 minutes</strong>.</p>
                <p style="color: #333333; font-size: 14px;">If you did not initiate this registration, please ignore this email or contact our support team immediately.</p>
                <p style="color: #333333; font-size: 14px;">Best regards,<br>${appName} Team</p>
              </div>
            `,
          });
        } catch (error) {
          console.error('Failed to send OTP email:', error);
          throw new Error('Failed to send OTP email');
        }
        break;
      default:
        throw new Error('Invalid OTP type');
    }
  }

  async sendPasswordResetConfirmation(email: string): Promise<void> {
    const appName = this.configService.get<string>('APP_NAME', 'EveBox');
    
    await this.transporter.sendMail({
      from: `"${appName}" <${this.configService.get<string>('EMAIL_FROM', 'hello@evebox.studio')}>`,
      to: email,
      subject: `${appName} - Password Reset Successful`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Password Reset Successful</h2>
          <p>Your password has been successfully reset.</p>
          <p>If you did not perform this action, please contact our support team immediately.</p>
          <p>Best regards,<br>${appName} Team</p>
        </div>
      `,
    });
  }

  async sendTicketEmail(data: UserOrderDto, pdf: { name: string; content: Buffer; type: string }[], email: string[]): Promise<void> {
    const webUrl = this.configService.get<string>('WEB_URL', 'https://evebox-fe.vercel.app');
    const ticketLink = `${webUrl}/ticket/${data.id}`;

    let formAnswersHtml = '';

    for (const answer of data.formResponse) {
      formAnswersHtml += `<p><strong>${answer.fieldName}:</strong> ${answer.value}</p>\n`;
    }
    try {
      const res = await this.transporter.sendMail({
        from: `EveBox <${this.configService.get<string>('EMAIL_USER', 'sp.bs.evebox@gmail.com')}>`,
        to: [...email, "baobao11062003@gmail.com"],
        subject: `Your ticket for ${data.Showing.title}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 500px; margin: auto; border: 1px solid #ddd; border-radius: 8px; overflow: hidden;">
            <div style="background-color: #0C4762; padding: 15px; color: white; text-align: center; font-size: 20px; font-weight: bold;">Evebox</div>
            <div style="padding: 20px;">
                <h2 style="color: #333; font-size: 18px; text-align: center;">Thông tin vé</h2>
                <p><strong>${data.Showing.title}</strong></p>
                <p><strong>⏰ ${new Date(data.Showing.startTime).toLocaleTimeString()} - ${new Date(data.Showing.startTime).toLocaleDateString()}</strong></p>
                <p>📍 <strong>${data.Showing.venue}</strong></p>
                <p>${data.Showing.locationsString}</p>

                <a style="display: block; margin: 0 auto; background-color: #51DACF; color: #0C4762; text-align: center; padding: 10px; border-radius: 4px; font-weight: bold; text-decoration: none;"
                  target="_blank" href="${ticketLink}">
                  Vé đã mua
                </a>

                <p style="margin-top: 15px;">Vé điện tử của bạn cũng được đính kèm trong email này. Vui lòng chuẩn bị sẵn vé điện tử tại nơi soát vé.</p>
                
                <p><strong>Mã đơn hàng:</strong> ${data.id}</p>
                <p style="font-size: 12px; color: gray;">(Dùng khi liên hệ bộ phận Chăm sóc Khách hàng)</p>
                
                <p><strong>Điều khoản và điều kiện</strong></p>
                <p>- Không hoàn tiền cho vé đã thanh toán</p>
                <p>- Người mua phải trình vé ở cửa để tham gia sự kiện hoặc bất kỳ thời điểm nào được yêu cầu</p>
                <p>- Khi mua vé, tức là người mua đã đồng ý với các điều khoản và điều kiện trên</p>
                <p>- Nếu bạn có câu hỏi, xin hãy liên hệ chúng tôi</p>
                <p>- Email: support@evebox.vn</p>
                <p>Hotline: 1900.6408 (Thứ 2 - Thứ 6, 08:30 - 18:30)</p>

                <h2 style="color: #333; font-size: 18px; text-align: center;">Thông tin người mua</h2>
                ${formAnswersHtml}

                <h2 style="color: #333; font-size: 18px; text-align: center;">Chi tiết đơn hàng</h2>
                <p><strong>Phương thức thanh toán:</strong> ${data.PaymentInfo.method}</p>
                <p><strong>Thời gian đặt vé: </strong>${new Date(data.PaymentInfo.paidAt).toLocaleTimeString()}, ${new
            Date(data.PaymentInfo.paidAt).toLocaleDateString()}</p>

                <div style="background-color: #f8f9fa; padding: 15px; border-radius: 8px; margin-top: 15px;">
                    <p><strong>Sản phẩm</strong> 
                      
                    ${
                      data.Ticket.map((ticket) => `
                      </p>
                    <p>${ticket.name}</p>
                    <p>${ticket.price.toLocaleString()} x ${ticket.tickets.length}
                      <span style="float: right; font-weight: bold;">
                        ${(ticket.price * ticket.tickets.length).toLocaleString()} VNĐ
                      </span>
                    </p>
                      `).join('')
                    }
                    <hr>
                    <p><strong>Phí giao hàng</strong> <span style="float: right;">0 VNĐ</span></p>
                    <p><strong>Phí dịch vụ</strong> <span style="float: right;">0 VNĐ</span></p>
                    <hr>
                    <p style="font-weight: bold; color: #0C4762; font-size: 18px;">Tổng tiền 
                      <span style="float: right;">
                        ${(data.price).toLocaleString()} VNĐ
                      </span>
                    </p>
                </div>

            </div>
          </div>
        `,
        attachments: pdf.map((file) => {
          return {
            filename: file.name,
            content: file.content,
            contentType: file.type,
          };
        }),
      });
    }
    catch (error) {
      console.error('Failed to send ticket email:', error);
      throw new Error('Failed to send ticket email');
    }
  }

  async sendNewEventToAdmins(email: string[], eventInfo: CreateEventDto, orgId: string): Promise<void> {
    const subject = `New Event Created: ${eventInfo.title} by ${orgId}`;
    const content = `
      <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: auto; border: 1px solid #eee; border-radius: 8px; padding: 20px;">
        <h2 style="color: #4CAF50; border-bottom: 1px solid #ddd; padding-bottom: 10px;">🎉 New Event Created</h2>

        <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
          <tr>
            <td style="font-weight: bold; padding: 8px; width: 150px;">Event Title:</td>
            <td style="padding: 8px;">${eventInfo.title}</td>
          </tr>
          <tr>
            <td style="font-weight: bold; padding: 8px;">Organizer:</td>
            <td style="padding: 8px;">${eventInfo.orgName}</td>
          </tr>
          <tr>
            <td style="font-weight: bold; padding: 8px;">Venue:</td>
            <td style="padding: 8px;">${eventInfo.venue}</td>
          </tr>
          <tr>
            <td style="font-weight: bold; padding: 8px;">Categories:</td>
            <td style="padding: 8px;">${eventInfo.categoryIds.join(', ')}</td>
          </tr>
          <tr>
            <td style="font-weight: bold; padding: 8px;">User ID:</td>
            <td style="padding: 8px;">${orgId}</td>
          </tr>
        </table>

        <div style="margin-top: 30px;">
          <h3 style="margin-bottom: 10px;">📋 Event Description</h3>
          <p style="line-height: 1.6;">${eventInfo.description}</p>
        </div>

        <div style="margin-top: 20px;">
          <h3 style="margin-bottom: 10px;">🏢 Organization Description</h3>
          <p style="line-height: 1.6;">${eventInfo.orgDescription}</p>
        </div>

        <p style="margin-top: 30px; font-size: 12px; color: #999;">
          This is an automated message from EveBox.
        </p>
      </div>
      <div style="text-align: center; margin: 40px 0;">
          <a href="https://evebox.azurewebsites.net/admin/event-management" 
            style="display: inline-block; background-color: #4CAF50; color: white; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: bold; font-size: 14px;">
            🔍 View in Dashboard
          </a>
        </div>
    `;


    try {
      await this.transporter.sendMail({
        from: `EveBox <${this.configService.get<string>('EMAIL_USER', 'sp.bs.evebox@gmail.com')}>`,
        to: email,
        subject: subject,
        html: content,
      });
    } catch (error) {
      console.error('Failed to send email:', error);
      throw new Error('Failed to send email');
    }
  }

  async sendNewEventToUsers(email: string[], eventInfo: CreateEventDto, eventId: number): Promise<void> {
    const subject = `New Event: ${eventInfo.title} From your favorite Organizer`;
    const content = `
      <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: auto; border: 1px solid #eee; border-radius: 8px; padding: 20px;">
        <h2 style="color: #4CAF50; border-bottom: 1px solid #ddd; padding-bottom: 10px;">🎉 New Event Alert</h2>

        <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
          <tr>
            <td style="font-weight: bold; padding: 8px; width: 150px;">Event Title:</td>
            <td style="padding: 8px;">${eventInfo.title}</td>
          </tr>
          <tr>
            <td style="font-weight: bold; padding: 8px;">Organizer:</td>
            <td style="padding: 8px;">${eventInfo.orgName}</td>
          </tr>
          <tr>
            <td style="font-weight: bold; padding: 8px;">Venue:</td>
            <td style="padding: 8px;">${eventInfo.venue}</td>
          </tr>
          <tr>
            <td style="font-weight: bold; padding: 8px;">Categories:</td>
            <td style="padding: 8px;">${eventInfo.categoryIds.join(', ')}</td>
          </tr>
        </table>

        <div style="margin-top: 30px;">
          <h3 style="margin-bottom: 10px;">📋 Event Description</h3>
          <p style="line-height: 1.6;">${eventInfo.description}</p>
        </div>

        <div style="margin-top: 20px;">
          <h3 style="margin-bottom: 10px;">🏢 Organization Description</h3>
          <p style="line-height: 1.6;">${eventInfo.orgDescription}</p>
        </div>

        <p style="margin-top: 30px; font-size: 12px; color: #999;">
          This is an automated message from EveBox.
        </p>
      </div>
      <div style="text-align: center; margin: 40px 0;">
          <a href="https://evebox.azurewebsites.net/event/${eventId}" 
            style="display: inline-block; background-color: #4CAF50; color: white; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: bold; font-size: 14px;">
            🔍 View Event
          </a>
      </div>
    `;
    try {
      await this.transporter.sendMail({
        from: `EveBox <${this.configService.get<string>('EMAIL_USER', 'sp.bs.evebox@gmail.com')}>`,
        to: email,
        subject: subject,
        html: content,
      });
    } catch (error) {
      console.error('Failed to send email:', error);
      throw new Error('Failed to send email');
    }
  }

  async sendNewShowingToUsers(email: string[], showing: PreviewShowingDto, eventId: number): Promise<void> {
    const subject = `New Showing: ${showing.title} at ${showing.venue}`;
    const content = `
      <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: auto; border: 1px solid #eee; border-radius: 8px; padding: 20px;">
        <h2 style="color: #4CAF50; border-bottom: 1px solid #ddd; padding-bottom: 10px;">🎉 Your Favorite Event Has New Showing</h2>

        <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
          <tr>
            <td style="font-weight: bold; padding: 8px; width: 150px;">Event Title:</td>
            <td style="padding: 8px;">${showing.title}</td>
          </tr>
          <tr>
            <td style="font-weight: bold; padding: 8px;">Venue:</td>
            <td style="padding: 8px;">${showing.venue}</td>
          </tr>
          <tr>
            <td style="font-weight: bold; padding: 8px;">Location:</td>
            <td style="padding: 8px;">${showing.locationsString}</td>
          </tr>
          <tr>
            <td style="font-weight: bold; padding: 8px;">Start Time:</td>
            <td style="padding: 8px;">${new Date(showing.startTime).toLocaleString()}</td>
          </tr>
          <tr>
            <td style="font-weight: bold; padding: 8px;">End Time:</td>
            <td style="padding: 8px;">${new Date(showing.endTime).toLocaleString()}</td>
          </tr>
        </table>

        ${showing.imageUrl ? `<img src="${showing.imageUrl}" alt="${showing.title}" style="width:100%; height:auto; margin-top:20px;" />` : ''}

        <p style="margin-top: 30px; font-size: 12px; color: #999;">
          This is an automated message from EveBox.
        </p>
      </div>
      <div style="text-align: center; margin: 40px 0;">
          <a href="https://evebox.azurewebsites.net/event/${eventId}" 
            style="display: inline-block; background-color: #4CAF50; color: white; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: bold; font-size: 14px;">
            🔍 View Showing
          </a>
      </div>
    `;
    try {
      await this.transporter.sendMail({
        from: `EveBox <${this.configService.get<string>('EMAIL_USER', 'sp.sp.bs.evebox@gmail.com')}>`,
        to: email,
        subject: subject,
        html: content,
      });
    } catch (error) {
      console.error('Failed to send email:', error);
      throw new Error('Failed to send email');
    }
  }

  async sendGiveAwayEmail(email: string[], fromEmail: string, sendKey: string): Promise<void> {
    const encodedKey = encodeURIComponent(sendKey);
    const subject = `You have received a ticket from ${fromEmail}`;
    const content = `
      <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: auto; border: 1px solid #eee; border-radius: 8px; padding: 20px;">
        <h2 style="color: #4CAF50; border-bottom: 1px solid #ddd; padding-bottom: 10px;">🎉 You have received a ticket!</h2>

        <p>Dear User,</p>
        <p>You have received a ticket from <strong>${fromEmail}</strong>. Please use the following step to claim your ticket:</p>
        <p>Please receive this ticket within 48 hours and before the showing be ended, otherwise it will be expired.</p>
        <div style="text-align: center; margin: 40px 0;">
            <a href="https://evebox.azurewebsites.net/order/receive?sendKey=${encodedKey}" 
              style="display: inline-block; background-color: #4CAF50; color: white; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: bold; font-size: 14px;">
              🔍 Click here to confirm receive it
            </a>
        </div>

        <p style="margin-top: 30px; font-size: 12px; color: #999;">
          This is an automated message from EveBox.
        </p>
      </div>
    `;
    try {
      await this.transporter.sendMail({
        from: `EveBox <${this.configService.get<string>('EMAIL_USER', 'sp.sp.bs.evebox@gmail.com')}>`,
        to: email,
        subject: subject,
        html: content,
      });
    } catch (error) {
      console.error('Failed to send email:', error);
      throw new Error('Failed to send email');
    }
  }

  async sendConfirmMessageWhenReceived(email:string, orderId: number, receiver: string): Promise<void> {
    const subject = `Ticket Received Confirmation`;
    const content = `
      <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: auto; border: 1px solid #eee; border-radius: 8px; padding: 20px;">
        <h2 style="color: #4CAF50; border-bottom: 1px solid #ddd; padding-bottom: 10px;">🎉 Ticket Received Successfully</h2>

        <p>Dear User,</p>
        <p>Your sending ticket request for order ID <strong>${orderId}</strong> has been successfully received by <strong>${receiver}</strong>.</p>

        <p style="margin-top: 30px; font-size: 12px; color: #999;">
          This is an automated message from EveBox.
        </p>
      </div>
    `;
    try {
      await this.transporter.sendMail({
        from: `EveBox <${this.configService.get<string>('EMAIL_USER', 'sp.sp.bs.evebox@gmail.com')}>`,
        to: email,
        subject: subject,
        html: content,
      });
    } catch (error) {
      console.error('Failed to send email:', error);
      throw new Error('Failed to send email');
    }
  }
}
