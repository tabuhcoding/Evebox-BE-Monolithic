// create-response.service.ts
import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { z } from 'zod';
import fromZodSchema from 'zod-to-json-schema';
import { SlackService } from 'src/infrastructure/adapters/slack/slack.service';

interface CreateContentOptions {
  systemPrompt: string;
  userPrompt: string;
  model?: string;
  temperature?: number;
  topP?: number;
  store?: string;
  tools?: any[];
  toolChoice?: string;
  schema?: z.ZodTypeAny;
  previousResponseId?: string;
}

interface ChatResponsesResponse {
  id: string;
  error: any;
  output: {
    id: string;
    type: string;
    text?: string;
    arguments?: string;
    status: string;
    role: string;
    content?: {
      type: string;
      text: string;
    }[];
  }[];
  status: string;
  usage: {
    input_tokens: number;
    input_tokens_details: {
      cached_tokens: number;
    };
    output_tokens: number;
    output_tokens_details: {
      reasoning_tokens: number;
    };
    total_tokens: number;
  };
}

@Injectable()
export class CreateResponseService {
  private readonly baseUrl = 'https://api.openai.com/v1/responses';

  constructor(private readonly slackService: SlackService) {}

  async generateContent(options: CreateContentOptions): Promise<{
    result: any;
    responseId: string;
    usage: ChatResponsesResponse['usage'];
  }> {
    const {
      systemPrompt,
      userPrompt,
      model = 'gpt-4.1-mini',
      temperature,
      topP,
      store,
      tools,
      toolChoice,
      schema,
      previousResponseId,
    } = options;

    const headers = {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    };

    const payload: any = {
      model,
      instructions: systemPrompt,
      input: userPrompt,
    };

    if (temperature !== undefined) payload.temperature = temperature;
    if (topP !== undefined) payload.top_p = topP;
    if (store) payload.store = store;
    if (previousResponseId) payload.previous_response_id = previousResponseId;
    if (tools) payload.tools = tools;
    if (toolChoice) payload.tool_choice = toolChoice;

    if (schema) {
      const jsonSchemaObject = fromZodSchema(schema).definitions?.ResponseSchema || fromZodSchema(schema);

      if (typeof jsonSchemaObject !== 'object' || jsonSchemaObject === null) {
        throw new Error('Schema must be of type object');
      }

      payload.text = {
        format: {
          type: 'json_schema',
          name: 'ResponseSchema',
          schema: jsonSchemaObject,
          strict: true,
        },
      };
    }

    try {
      const response = await axios.post<ChatResponsesResponse>(this.baseUrl, payload, { headers });
      const data = response.data;

      // await this.slackService.sendNotice(`📝 OpenAI content generation successful: ${JSON.stringify(data.output)}`);
      if (!data.output) {
        throw new Error('Empty content returned from OpenAI');
      }

      const output = data.output[0];
      const responseId = data.id;

      let parsed: any;

      if (output.type === 'function_call' && output.arguments) {
        parsed = schema ? schema.parse(JSON.parse(output.arguments)) : JSON.parse(output.arguments);
      } else {
        const contentText = output.content?.[0]?.text;
        if (!contentText) throw new Error('Empty content returned from OpenAI');
        parsed = schema ? schema.parse(JSON.parse(contentText)) : contentText;
      }


      return {
        result: parsed,
        responseId,
        usage: data.usage,
      };
    } catch (error: any) {
      const message = error.response?.data?.error?.message || error.message;
      this.slackService.sendError(`❌ CreateResponseService >>> OpenAI content generation failed: ${message}`);
      throw new Error('OpenAI content generation failed');
    }
  }
}