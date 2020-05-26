import axios from 'axios';

export class TelegramBot {
  private readonly baseUrl: string;

  constructor(botId: string, key: string) {
    this.baseUrl = `https://api.telegram.org/bot${botId}:${key}`;
  }

  async sendMessage(chatId: string, text: string): Promise<void> {
    await axios(`${this.baseUrl}/sendMessage`, {
      method: 'POST',
      data: {
        chat_id: chatId,
        text,
      },
    });
  }
}
