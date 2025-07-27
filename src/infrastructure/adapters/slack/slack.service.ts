import { Injectable } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class SlackService {
  private readonly webhookUrl = process.env.SLACK_WEBHOOK_URL!;
  private readonly isDevelopment = process.env.ENV === 'development';
  private readonly use_telegram = process.env.USE_TELEGRAM! === 'telegram';
  private readonly token = process.env.TELEGRAM_BOT_TOKEN!;
  private readonly chatId = process.env.TELEGRAM_CHAT_ID!;

  private async sendMessage(text: string) {
    if (this.isDevelopment) {
      console.log('Telegram log:', text);
      return;
    }

    const url = `https://api.telegram.org/bot${this.token}/sendMessage`;
    try {
      await axios.post(url, {
        chat_id: this.chatId,
        text,
        parse_mode: 'Markdown',
      });
    } catch (err) {
      await axios.post(url, {
        chat_id: this.chatId,
        text: `*Error sending message to Telegram*\n${text}. Err: ${err.message}`,
      });
    }
  }

  async sendError(message: string) {
    if (this.use_telegram) {
      // await this.sendMessage(`🚨 *ERROR*:\n${message}`);
      // await this.sendSlackError(message);
      return;
    } else {
      // await this.sendSlackError(message);
    }
  }

  async sendNotice(message: string) {
    if (this.use_telegram) {
      // await this.sendMessage(`📝 *NOTICE*:\n${message}`);
      // await this.sendSlackNotice(message);
      return;
    } else{
      // await this.sendSlackNotice(message);
    }
  }

  async sendSlackError(message: string) {
    if (this.isDevelopment) {
      console.log('Console error:', message);
      
      return;
    }
    try {
      await axios.post(this.webhookUrl, {
        text: `:rotating_light: *ERROR*:\n${message}`,
      });
    } catch (err) {
      return
    }
  }

  async sendSlackNotice(message: string) {
    if (this.isDevelopment) {
      console.log('Console notice:', message);
      
      return;
    }
    try {
      await axios.post(this.webhookUrl, {
        text: `:memo: *NOTICE*:\n${message}`,
      });
    } catch (err) {
      return;
    }
  }

  
}
