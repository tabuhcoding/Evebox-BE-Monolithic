// embedding-wrapper.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { PGVectorStore } from '@langchain/community/vectorstores/pgvector';
import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';
import { CohereEmbeddings } from '@langchain/cohere';
import { Document } from 'langchain/document';
import { GEMINI_API_KEY_VECTOR, COHERE_API_KEY_VECTOR } from 'src/shared/utils/rag/key.containts';

type EmbeddingProvider = 'gemini' | 'cohere';

@Injectable()
export class EmbeddingWrapperService {
  private readonly logger = new Logger(EmbeddingWrapperService.name);
  private readonly PROVIDERS: { provider: EmbeddingProvider; keys: string[] }[] = [
    { provider: 'gemini', keys: GEMINI_API_KEY_VECTOR },
    { provider: 'cohere', keys: COHERE_API_KEY_VECTOR },
  ];

  private isQuotaError(err: any): boolean {
    const msg = err?.message?.toLowerCase() || '';
    return msg.includes('quota') || msg.includes('limit') || msg.includes('exceeded') || msg.includes('token');
  }

  private async initStore(
    provider: EmbeddingProvider,
    apiKey: string,
    collectionName: string
  ): Promise<PGVectorStore> {
    const embeddings =
      provider === 'gemini'
        ? new GoogleGenerativeAIEmbeddings({ apiKey, modelName: 'embedding-001' })
        : new CohereEmbeddings({ apiKey, model: 'embed-multilingual-v3.0' });

    const store = await PGVectorStore.initialize(embeddings, {
      postgresConnectionOptions: {
        connectionString:
          provider === 'gemini' ? process.env.VECTOR_STORE_URL_GEMINI : process.env.VECTOR_STORE_URL_COHERE,
      },
      tableName: collectionName,
    });

    return store;
  }

  async embedDocumentsWithRetry(documents: Document[], collectionName: string): Promise<void> {
    const BATCH_SIZE = 100;
    const DELAY_MS = 1500;

    for (const { provider, keys } of this.PROVIDERS) {
      for (const key of keys) {
        try {
          const store = await this.initStore(provider, key, collectionName);

          for (let i = 0; i < documents.length; i += BATCH_SIZE) {
            const batch = documents.slice(i, i + BATCH_SIZE);
            this.logger.log(`🚀 [${provider}] Embedding batch ${i / BATCH_SIZE + 1} with key ${key.slice(0, 10)}...`);
            await store.addDocuments(batch); // <== nếu lỗi quota ở đây, ta sẽ bắt được
            await new Promise((r) => setTimeout(r, DELAY_MS));
          }

          this.logger.log(`✅ Embedded ${documents.length} docs using ${provider}.`);
          return;
        } catch (err) {
          if (this.isQuotaError(err)) {
            this.logger.warn(`⚠️ [${provider}] Key quota exceeded while embedding. Retrying next key...`);
            continue;
          }

          this.logger.error(`❌ Unexpected error from ${provider}: ${err.message}`);
          throw err;
        }
      }
    }

    throw new Error('❌ All embedding providers and API keys exhausted during embedding.');
  }

  async searchWithRetry(query: string, collectionName: string, k = 5) {
    for (const { provider, keys } of this.PROVIDERS) {
      console.log(`🔍 Searching with ${provider}...`);
      for (const key of keys) {
        try {
          const store = await this.initStore(provider, key, collectionName);
          const results = await store.similaritySearch(query, k); // <== retry nếu quota lỗi ở đây
          this.logger.log(`✅ Search success with ${provider}, key ${key.slice(0, 5)}...`);
          return results;
        } catch (err) {
          if (this.isQuotaError(err)) {
            this.logger.warn(`⚠️ [${provider}] Quota exceeded while searching. Retrying next key...`);
            continue;
          }
          this.logger.error(`❌ Error during search: ${err.message}`);
          throw err;
        }
      }
    }

    throw new Error('❌ All providers failed during similarity search.');
  }
}
