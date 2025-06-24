// ✅ File: description-generate.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { z } from 'zod';
import { OpenAIVectorStoreService } from '../../core-embedding/vector-store.service';
import { CreateResponseService } from '../../provider/create-response.service';
import { SlackService } from 'src/infrastructure/adapters/slack/slack.service';
import { Document } from 'langchain/document';
import { DescriptionGenerateDTO } from './description-generate.dto';
import { EventDocumentBuilder } from '../../core-embedding/event-document.builder';
import { FileCacheService } from 'src/infrastructure/cache/fileCache/fileCache.service';
import { CheckUserExistService } from 'src/services/auth-svc/modules/user/commands/checkuserExist/checkuserExist.service';

const DescriptionOutputSchema = z.object({
  htmlDescription: z.string().min(20),
});

type DescriptionOutput = z.infer<typeof DescriptionOutputSchema>;

@Injectable()
export class DescriptionGenerateService {
  constructor(
    private readonly vectorStore: OpenAIVectorStoreService,
    private readonly openai: CreateResponseService,
    private readonly slack: SlackService,
    private readonly fileCache: FileCacheService,
    private readonly checkUserExists: CheckUserExistService,
  ) {}

  private async retrieveSimilarDescriptions(query: string): Promise<Document[]> {
    const results = await this.vectorStore.searchSimilarEventsByText(query, 10);
    return results;
  }

  async generateDescription(dto: DescriptionGenerateDTO, email: string): Promise<[string, string]> {
    await this.slack.sendNotice(`📝 Generating description for event: ${JSON.stringify(dto)} by user: ${email}`);
    try {
      const cacheUser = await this.fileCache.getCacheObjectById(
        `generated_description`, {}, email
      ) as any;

      const userExists = await this.checkUserExists.execute(email);
      if (!userExists) {
        throw new Error('Unauthorized user');
      }

      const searchQuery = EventDocumentBuilder.eventToString(dto.Event, dto.description);
      const contextDocs = await this.retrieveSimilarDescriptions(searchQuery);
      const context = contextDocs.map(d => d.pageContent).join('\n\n');

    const systemPrompt = `
Bạn là AI chuyên tạo mô tả HTML cho sự kiện. Mỗi mô tả cần có ít nhất:
- Tối thiểu 2 hình ảnh (có thể chèn bằng <img src="{{...}}"> nếu chưa có).
- Term/slogan ngắn (ví dụ: "Cháy hết mình!", "Một đêm không ngủ!")
- Đặc điểm nổi bật của sự kiện (ví dụ: "Nơi hội tụ của những người đam mê công nghệ", "Sự kiện không thể bỏ lỡ trong năm 2025").
- Điều khoản cho người tham gia
- Định dạng: HTML.

Nếu có các phần mà bạn chưa nắm rõ thông tin nhưng nó là phần nên có trong mô tả, hãy gợi ý cho người dùng bằng cách để lại chỗ trống và sử dụng chú thích kèm tag <b>{{...}}</b> và màu đỏ để đánh dấu.
Ví dụ: Ở hỉnh ảnh, nếu bạn không có ảnh, hãy để lại 
<b style="color: red;">Hãy chèn ảnh về ... tại đây</b>
<img src="{{image_url}}" alt="Mô tả hình ảnh">.

10 mô tả sự kiện liên quan (để tham khảo):\n${context}

Ngôn ngữ sử dụng: ${dto.language.toUpperCase()}.
`;

    const userRequest = dto.userRequest ? `${dto.userRequest}` : 'Tạo mô tả HTML mới cho sự kiện này';

    const userPrompt = `
Thông tin sự kiện người dùng: ${JSON.stringify(dto.Event, null, 2)}

Mô tả hiện tại (nếu có): ${dto.description || 'Không có'}

Yêu cầu của người dùng (nếu có): ${userRequest || 'Không có'}

Hãy tạo mô tả HTML cho sự kiện này, dựa trên thông tin và mô tả hiện tại, đồng thời tham khảo các mô tả sự kiện liên quan đã cung cấp và yêu cầu của người dùng.
`;

    const funcDesc = {
      type: 'function',
      name: 'generateEventDescription',
      description: 'Tạo mô tả HTML cho sự kiện từ dữ liệu người dùng và mô tả liên quan',
      parameters: {
        type: 'object',
        properties: {
          htmlDescription: {
            type: 'string',
            description: 'Mô tả sự kiện ở định dạng HTML, có tối thiểu 2 ảnh và term nổi bật',
          },
        },
        required: ['htmlDescription'],
      },
    };

    // await this.slack.sendNotice(`📝 Generating description with system prompt: ${systemPrompt} and user prompt: ${userPrompt}`);

    var { result, responseId, usage } = await this.openai.generateContent({
      systemPrompt,
      userPrompt,
      schema: DescriptionOutputSchema,
      previousResponseId: dto.previousID,
      tools: [funcDesc],
      toolChoice: 'required',
      model: 'gpt-4.1-mini',
      temperature: 0.6,
    });

    await this.slack.sendNotice(`📝 Description generated successfully:
      ${JSON.stringify(result)}
      Response ID: ${responseId}
      Usage: ${JSON.stringify(usage)}`);

    if (usage.total_tokens > 30000) {
      responseId = '';
    }

    await this.fileCache.cacheObject(
      `generated_description`,
      60 * 24,
      {},
      email,
      [{ count: 1 }]
    );

    return [result.htmlDescription, responseId];
    } catch (error) {
      await this.slack.sendError(`❌ Error generating description: ${error.message}`);
      throw new Error('Failed to generate event description');
    }
  }
}
