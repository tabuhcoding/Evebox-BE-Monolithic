import { Injectable } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class SlackService {
  private readonly webhookUrl = process.env.SLACK_WEBHOOK_URL!;
  private readonly isDevelopment = process.env.NODE_ENV === 'development';

  async sendError(message: string) {
    if (this.isDevelopment) {
      
      return;
    }
    try {
      await axios.post(this.webhookUrl, {
        text: `:rotating_light: *ERROR*:\n${message}`,
      });
    } catch (err) {
      console.error('Slack send failed:', err.message);
    }
  }

  async sendNotice(message: string) {
    try {
      await axios.post(this.webhookUrl, {
        text: `:memo: *NOTICE*:\n${message}`,
      });
    } catch (err) {
      console.error('Slack send failed:', err.message);
    }
  }
}
