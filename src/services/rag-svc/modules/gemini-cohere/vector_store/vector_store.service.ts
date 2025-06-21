// vector-store.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { Document } from 'langchain/document';
import { EmbeddingWrapperService } from '../embedding_wrapper/embedding_wrapper.service';

@Injectable()
export class VectorStoreService {
  private readonly logger = new Logger(VectorStoreService.name);

  constructor(private readonly embeddingWrapperService: EmbeddingWrapperService) {}

  async embedDocuments(documents: Document[], collectionName: string): Promise<void> {
    try {
      await this.embeddingWrapperService.embedDocumentsWithRetry(documents, collectionName);
    } catch (error) {
      this.logger.error(`❌ Failed to embed documents: ${error.message}`);
    }
  }

  async searchDocuments(query: string, collectionName: string, k = 5) {
    try {
      return await this.embeddingWrapperService.searchWithRetry(query, collectionName, k);
    } catch (error) {
      this.logger.error(`❌ Search failed: ${error.message}`);
      throw error;
    }
  }
}
