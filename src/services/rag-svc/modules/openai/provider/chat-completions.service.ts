// ✅ File: chat-completion.service.ts
import OpenAI from 'openai';
import { z } from 'zod';
import fromZodSchema from 'zod-to-json-schema';
import { Injectable } from '@nestjs/common';
import { SlackService } from 'src/infrastructure/adapters/slack/slack.service';

@Injectable()
export class ChatCompletionService {
  private readonly openai: OpenAI;

  constructor(private readonly slackService: SlackService) {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY!,
    });
  }

  async createCompletion(options: {
    model?: string;
    messages: OpenAI.ChatCompletionMessageParam[];
    temperature?: number;
    schema?: z.ZodTypeAny;
  }) {
    const {
      model = 'gpt-3.5-turbo-1106',
      messages,
      temperature = 0.7,
      schema,
    } = options;

    const tools = schema
      ? [
          {
            type: 'function' as const,
            function: {
              name: 'generate_response',
              description: 'Hàm sinh mô tả dựa vào schema yêu cầu',
              parameters: fromZodSchema(schema).definitions?.ResponseSchema ?? fromZodSchema(schema),
            },
          },
        ]
      : undefined;

    try {
      const completion = await this.openai.chat.completions.create({
        model,
        messages,
        temperature,
        tools,
        tool_choice: tools
          ? {
              type: 'function',
              function: { name: 'generate_response' },
            }
          : undefined,
      });

      const response = completion.choices[0];

      if (schema) {
        const functionCall = response.message.tool_calls?.[0]?.function;
        const parsed = schema.parse(JSON.parse(functionCall.arguments));
        return parsed;
      }

      return response.message.content;
    } catch (err: any) {
      await this.slackService.sendError(`❌ ChatCompletionService error: ${err.message}`);
      throw err;
    }
  }
}
