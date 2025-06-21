import { Injectable, Logger } from '@nestjs/common';
import { VectorStoreService } from '../vector_store/vector_store.service';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { PromptTemplate } from '@langchain/core/prompts';
import { Document } from 'langchain/document';
import { GEMINI_API_KEY, COHERE_API_KEY } from 'src/shared/utils/rag/key.containts';
import { ChatCohere } from 'src/shared/utils/rag/cohere.chat';
import { EventDescriptionGenDto } from './descriptionGenerate.dto';
import { transformEventsDtoToQuery } from 'src/shared/utils/rag/transform_documents';
import { console } from 'inspector';
import { SlackService } from 'src/infrastructure/adapters/slack/slack.service';

type DGState = {
  question: string;
  context?: Document[];
  answer?: string;
};
type ChatProvider = 'gemini' | 'cohere';

@Injectable()
export class DescriptionGenerateService {
  private readonly logger = new Logger(DescriptionGenerateService.name);
  private readonly COLLECTION_NAME = 'eveboxEventsDescription';
  private readonly PROVIDERS: { provider: ChatProvider; keys: string[] }[] = [
    { provider: 'gemini', keys: GEMINI_API_KEY },
    { provider: 'cohere', keys: COHERE_API_KEY },
  ];
  constructor(private readonly vectorStore: VectorStoreService,
    private readonly slackService: SlackService,
  ) {
    this.slackService.sendNotice(`Service initialized.`);
  }

  private isQuotaError(err: any): boolean {
    const msg = err?.message?.toLowerCase() || '';
    return msg.includes('quota') || msg.includes('limit') || msg.includes('exceeded') || msg.includes('token');
  }

  private async retrieve(state: DGState): Promise<Partial<DGState>> {
    this.logger.log(`📥 [Step: Retrieve] Searching for relevant documents...`);

    const results = await this.vectorStore.searchDocuments(
      state.question,
      this.COLLECTION_NAME,
      15,
    );

    return { context: results };
  }

  private async generate(state: DGState, description: string): Promise<Partial<DGState>> {
  
    const promptTemplate = PromptTemplate.fromTemplate(`
      Bạn là trợ lý AI. Dưới đây là các tài liệu có thể liên quan đến câu hỏi:
      
      Kết quả search similarity: {context}
      
      Các thông tin thêm liên quan đến sự kiện nếu người dùng có cung cấp: {description}

      Các thông tin về sự kiện của người dùng: {information}
            
      Ở 15 kết quả search similarity trên chính là 15 description của các sự kiện có liên quan đến người dùng.
      Từ 15 description đó, kết hợp với thông tin về sự kiện của người dùng và các thông tin thêm, hãy tạo ra một mô tả mới, chi tiết và hấp dẫn hơn cho sự kiện của người dùng, theo html format.
      Nếu có các field mà bạn cảm thấy nó hữu ích, hoặc một số nơi nên thêm hình ảnh, nhưng bạn không thể tự generate được, hãy để lại một placeholder với kí hiệu kiểu {{ Hãy điền ... ở đây }}, thay ... bằng tên của field mà bạn muốn thêm vào.
      Các trường thông tin không cần thiết: Ngày tổ chức, ngày bắt đầu, ngày kết thúc, ngày bán vé, Đường dẫn mua vé, Đường dẫn sự kiện, Video
      
      Hãy chắc chắn rằng mô tả mới này không giống với bất kỳ mô tả nào trong 15 kết quả search similarity.
      Chỉ trả về nội dung mô tả mới mà không cần thêm bất kỳ thông tin nào khác.
      Mỗi sự kiện đều nên cần có mô tả chi tiết về nội dung, thêm ít nhất là 1, 2 hình ảnh, ...
      Cẩn thận với các kí hiệu, không được để thừa hoặc thiếu bất kỳ kí hiệu nào.
    `);
  
    const prompt = await promptTemplate.format({
      context: state.context?.map(doc => doc.pageContent).join('\n\n') || '',
      description: description,
      information: state.question,
    });
  
    const rawContent = await this.invokeWithRetry(prompt);

    console.log(rawContent);
  
    // 👇️ Nếu là JSON string kiểu langchain_core, extract content
    let answer: string = rawContent;
    try {
      const parsed = JSON.parse(rawContent);
      if (parsed?.kwargs?.content) {
        answer = parsed.kwargs.content;
      }
    } catch (_) {
      // not JSON, do nothing
    }
  
    return { answer };
  }
  
  private async invokeWithRetry(prompt: string): Promise<string> {
    for (const { provider, keys } of this.PROVIDERS) {
      for (const key of keys) {
        try {
          let content: string;
  
          if (provider === 'gemini') {
            const model = new ChatGoogleGenerativeAI({
              apiKey: key,
              model: 'gemini-1.5-pro',
              maxOutputTokens: 2048,
            });
            const response = await model.invoke(prompt);
            content = typeof response === 'string' ? response : JSON.stringify(response);
          } else if (provider === 'cohere') {
            const model = new ChatCohere(key, 'command-r-plus'); // hoặc command-a-03-2025
            content = await model.invoke(prompt);
          }
  
          this.logger.log(`✅ ${provider} responded with key index ${keys.indexOf(key) + 1}`);
          return content!;
        } catch (err: any) {
          if (this.isQuotaError(err)) {
            this.logger.warn(`⚠️ ${provider} key quota exceeded. Trying next key...`);
            continue;
          }
  
          this.logger.error(`❌ ${provider} invoke failed: ${err.message}`);
          throw err;
        }
      }
    }
  
    throw new Error('❌ All API keys exhausted during RAG flow.');
  }

  async askQuestion(dto: EventDescriptionGenDto): Promise<{
    answer: string;
  }> {
    const question = transformEventsDtoToQuery(dto);
    const state: DGState = { question: question };

    try {
      const retrieved = await this.retrieve(state);
      const generated = await this.generate({ ...state, ...retrieved }, dto.description);

      const answer = generated.answer ?? '❌ No answer generated.';
      this.logger.log(`✅ Final answer generated.`);
      return {
        answer,
      };
    } catch (error) {
      this.logger.error(`❌ RAG flow failed: ${error.message}`);
      throw error;
    }
  }
}
