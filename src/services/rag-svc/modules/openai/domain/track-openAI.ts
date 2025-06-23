import { OpenAIEmbeddings } from '@langchain/openai';
import { encoding_for_model, TiktokenModel } from 'tiktoken';
import { SlackService } from 'src/infrastructure/adapters/slack/slack.service';

export function countTokens(text: string, model: TiktokenModel = 'text-embedding-3-small'): number {
  const encoder = encoding_for_model(model);
  const tokens = encoder.encode(text);
  const count = tokens.length;
  encoder.free(); // Important to release memory
  return count;
}

export class TrackedOpenAIEmbeddings extends OpenAIEmbeddings {
  private slackService: SlackService;

  constructor(apiKey: string, modelName: string, slackService: SlackService) {
    super({ apiKey, modelName });
    this.slackService = slackService;
  }

  override async embedDocuments(texts: string[]): Promise<number[][]> {
    const vectors = await super.embedDocuments(texts);
    const estimatedTokens = texts.reduce((sum, t) => sum + countTokens(t), 0);
    await this.slackService.sendNotice(`📄 embedDocuments used estimated ${estimatedTokens} tokens for ${texts.length} texts`);
    return vectors;
  }

  override async embedQuery(text: string): Promise<number[]> {
    const vector = await super.embedQuery(text);
    const estimatedTokens = countTokens(text);
    await this.slackService.sendNotice(`🔍 embedQuery used estimated ${estimatedTokens} tokens`);
    return vector;
  }
}
