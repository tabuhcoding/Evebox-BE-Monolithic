// src/utils/cohere.chat.ts
import { CohereClient } from 'cohere-ai';

export class ChatCohere {
  private readonly client: CohereClient;

  constructor(private readonly apiKey: string, private readonly model = 'command-r-plus') {
    this.client = new CohereClient({ token: this.apiKey });
  }

  async invoke(prompt: string): Promise<string> {
    const response = await this.client.chat({
      model: this.model,
      message: prompt,
      temperature: 0.3,
    });

    const content = response.text;
    if (!content) {
      throw new Error('Cohere returned empty response');
    }

    return content;
  }
}
