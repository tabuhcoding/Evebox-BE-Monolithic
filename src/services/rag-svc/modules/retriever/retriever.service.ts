import { Injectable, Logger } from '@nestjs/common';
import { Document } from 'langchain/document';
import { VectorStoreService } from '../vector_store/vector_store.service';

@Injectable()
export class RetrieverService {
  private readonly logger = new Logger(RetrieverService.name);
  private readonly COLLECTION_NAME = 'eveboxEvents';

  constructor(private readonly vectorStoreService: VectorStoreService) {}

  async search(query: string, k = 10, scoreThreshold = 0.5): Promise<Document[]> {
    try {
      // Gọi search từ VectorStoreService với fallback logic đã có
      const results = await this.vectorStoreService.searchDocuments(query, this.COLLECTION_NAME, k);

      // Lọc lại theo scoreThreshold nếu kết quả có `score`
      const filtered = results.filter((doc: any) => {
        const score = doc?.score ?? 1.0;
        return score >= scoreThreshold;
      });

      this.logger.log(`🔍 Retrieved ${filtered.length}/${results.length} docs above threshold ${scoreThreshold}`);
      return filtered;
    } catch (error) {
      this.logger.error(`❌ Error while searching: ${error.message}`, error.stack);
      throw error;
    }
  }
}
