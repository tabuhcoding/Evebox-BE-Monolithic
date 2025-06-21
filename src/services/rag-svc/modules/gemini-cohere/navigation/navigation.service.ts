import { Injectable, Logger } from "@nestjs/common";
import { PromptTemplate } from '@langchain/core/prompts';
import { RouteDescription, RouteEnum } from "src/shared/utils/rag/navigation.enum";
import { RAGService } from "../rag/rag.service";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { GEMINI_API_KEY, COHERE_API_KEY } from 'src/shared/utils/rag/key.containts';
import { ChatCohere } from 'src/shared/utils/rag/cohere.chat';
import { json } from "stream/consumers";

type NavigationResult = {
  Route: string;
  Message: string;
  NextPrompt: string | null;
  ResultMessage?: string;
  Result?: string[];
};
type ChatProvider = 'gemini' | 'cohere';

@Injectable()
export class NavigationService {
  private readonly logger = new Logger(NavigationService.name);
  private readonly PROVIDERS: { provider: ChatProvider; keys: string[] }[] = [
    { provider: 'gemini', keys: GEMINI_API_KEY },
    { provider: 'cohere', keys: COHERE_API_KEY },
  ];
  constructor(private readonly ragService: RAGService) {}

  private isQuotaError(err: any): boolean {
    const msg = err?.message?.toLowerCase() || '';
    return msg.includes('quota') || msg.includes('limit') || msg.includes('exceeded') || msg.includes('token');
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

  async select_route(query: string): Promise<NavigationResult> {
    const template = `
Bạn là một trợ lý AI. Dưới đây là danh sách các route có thể điều hướng:
{routeMap}

Tôi sẽ cung cấp một câu hỏi của người dùng. Dựa vào đó, bạn phải chọn một trong các route trên, kèm lý do, và nếu route là "SEARCH_PAGE", hãy sinh ra một câu lệnh tìm kiếm phù hợp.

Hãy trả về kết quả theo định dạng JSON như sau (chú ý dùng dấu ngoặc kép đúng chuẩn JSON):

{{
  "Route": "ROUTE_NAME",
  "Message": "Giải thích với người dùng, tại sao lại chọn route này, và các hướng dẫn cần thiết. Phần này chỉ được có chữ cái, dấu phẩy và dấu chấm",
  "NextPrompt": "Câu lệnh tìm kiếm hoặc null"
}}

Câu hỏi: {question}
`;

    const promptTemplate = PromptTemplate.fromTemplate(template);
    const prompt = await promptTemplate.format({
      question: query,
      routeMap: Object.entries(RouteDescription)
        .map(([route, description]) => `- ${route}: ${description}`)
        .join('\n'),
    });

    var raw = await this.invokeWithRetry(prompt);


    const parseRaw = JSON.parse(raw);
    if (parseRaw?.kwargs?.content) {
      raw = parseRaw.kwargs.content;
    }
    this.logger.log(raw);

    function extractJSONFromMarkdown(raw: string): any {
      const match = raw.match(/```json\s*([\s\S]*?)```/i);
      const jsonStr = match ? match[1] : raw;
    
      // Làm sạch các escape sequence có thể gây lỗi
      const cleaned = jsonStr
        .replace(/\\n/g, '\n') // remove \n if it's escaped
        .replace(/\\"/g, '"') // unescape quote
        .replace(/\\'/g, "'") // unescape single quote
        .trim();
    
      return JSON.parse(cleaned);
    }
    

    try {
      const parsed: NavigationResult = extractJSONFromMarkdown(raw);

      if (!parsed.Route || !(parsed.Route in RouteDescription)) {
        throw new Error(`Invalid Route: ${parsed.Route}`);
      }

      if (parsed.Route === RouteEnum.SEARCH_PAGE) {
        const { answer, context } = await this.ragService.askQuestion(
          parsed.NextPrompt,
          query,
        );

        parsed.Result = context.map((doc) => doc.metadata?.id ?? 'unknown');
        parsed.ResultMessage = answer;
      }

      return parsed;
    } catch (err: any) {
      throw new Error(`❌ Failed to parse Gemini response: ${err.message}\nRaw content:\n${raw}`);
    }
  }
}
