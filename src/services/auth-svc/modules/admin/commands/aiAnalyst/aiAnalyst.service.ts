import { Inject, Injectable } from "@nestjs/common";
import { AIAnalyst, AIAnalystRepository } from "src/services/auth-svc/repository/ai-analyst/ai-analyst.repo";
import { Pagination, PaginationQuery } from "src/shared/constants/pagination";

@Injectable()
export class AIAnalystService {
  constructor(
    @Inject('AIAnalystRepository') private readonly aiAnalystRepository: AIAnalystRepository,
  ) {}

  async createAIAnalyst(useFor: string, content: string, threadId: string, type: string, query: string): Promise<void> {
    try {
      await this.aiAnalystRepository.insertOne({
        use_for: useFor,
        content: content,
        thread_id: threadId,
        type: type,
        query: query,
      });
    } catch (error) {
      throw new Error(`Failed to create AI Analyst entry: ${error.message}`);
    }
  }

  async getAIAnalyst(useFor: string, type: string, pagination: PaginationQuery): Promise<[AIAnalyst[], Pagination]> {
    try {
      const totalItems = await this.aiAnalystRepository.count({
        use_for: useFor,
        type: type,
      });

      const paginationResult : Pagination = {
        page: pagination.page,
        limit: pagination.limit,
        totalItems: totalItems,
        totalPages: Math.ceil(totalItems / pagination.limit),
      }

      const data = await this.aiAnalystRepository.findMany({
        use_for: useFor,
        type: type,
      }, {}, { id: 'desc'}, (paginationResult.page - 1) * paginationResult.limit, paginationResult.limit);
      return [data, paginationResult];
    } catch (error) {
      throw new Error(`Failed to retrieve AI Analyst entries: ${error.message}`);
    }
  }
}