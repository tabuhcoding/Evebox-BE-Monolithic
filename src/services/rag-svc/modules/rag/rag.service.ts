import { Injectable, Logger } from '@nestjs/common';
import { VectorStoreService } from '../vector_store/vector_store.service';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { PromptTemplate } from '@langchain/core/prompts';
import { Document } from 'langchain/document';
import { GEMINI_API_KEY, COHERE_API_KEY } from 'src/shared/utils/rag/key.containts';
import { ChatCohere } from 'src/shared/utils/rag/cohere.chat';

type RAGState = {
  question: string;
  context?: Document[];
  answer?: string;
  nextPrompt?: string;
};
type ChatProvider = 'gemini' | 'cohere';

@Injectable()
export class RAGService {
  private readonly logger = new Logger(RAGService.name);
  private readonly COLLECTION_NAME = 'eveboxEvents';
  private readonly PROVIDERS: { provider: ChatProvider; keys: string[] }[] = [
    { provider: 'gemini', keys: GEMINI_API_KEY },
    { provider: 'cohere', keys: COHERE_API_KEY },
  ];
  constructor(private readonly vectorStore: VectorStoreService) {}

  private isQuotaError(err: any): boolean {
    const msg = err?.message?.toLowerCase() || '';
    return msg.includes('quota') || msg.includes('limit') || msg.includes('exceeded') || msg.includes('token');
  }

  private async retrieve(state: RAGState): Promise<Partial<RAGState>> {
    this.logger.log(`📥 [Step: Retrieve] Searching for relevant documents...`);

    const results = await this.vectorStore.searchDocuments(
      state.nextPrompt || state.question,
      this.COLLECTION_NAME,
      10,
    );

    return { context: results };
  }

  private async generate(state: RAGState): Promise<Partial<RAGState>> {
  
    const promptTemplate = PromptTemplate.fromTemplate(`
      Bạn là trợ lý AI. Dưới đây là các tài liệu có thể liên quan đến câu hỏi:
      
      Kết quả search similarity: {context}
      
      Câu hỏi gốc: {question}
      
      Câu hỏi sau khi xử lý qua invoke: {nextPrompt}
      
      Hãy trả lời một cách chính xác và rõ ràng nhất dựa trên các tài liệu trên, vì sao lại chuyển đến trang search, kết quả search có yếu tố gì để đáp ứng được.
      Hãy trả lời trực tiếp đối với người hỏi.
    `);
  
    const prompt = await promptTemplate.format({
      question: state.question,
      context: state.context?.map(doc => doc.pageContent).join('\n\n') || '',
      nextPrompt: state.nextPrompt || '',
    });
  
    const rawContent = await this.invokeWithRetry(prompt);
  
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

  async askQuestion(nextPrompt: string, originalQuestion: string): Promise<{
    answer: string;
    context?: Document[];
  }> {
    const state: RAGState = { question: originalQuestion, nextPrompt };

    try {
      const retrieved = await this.retrieve(state);
      const generated = await this.generate({ ...state, ...retrieved });

      const answer = generated.answer ?? '❌ No answer generated.';
      this.logger.log(`✅ Final answer generated.`);
      return {
        answer,
        context: retrieved.context,
      };
    } catch (error) {
      this.logger.error(`❌ RAG flow failed: ${error.message}`);
      throw error;
    }
  }
}
