// vector-store.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { Document } from 'langchain/document';
import { PGVectorStore } from '@langchain/community/vectorstores/pgvector';
import { CohereEmbeddings } from '@langchain/cohere'; // 🆕 dùng Cohere
import { Pool } from 'pg';

@Injectable()
export class VectorStoreCohereService {
  private readonly logger = new Logger(VectorStoreCohereService.name);
  private readonly pool = new Pool({
    connectionString: process.env.VECTOR_STORE_URL_COHERE,
  });

  private async getVectorStore(collectionName: string): Promise<PGVectorStore> {
    try {
      console.log(`🔗 Connecting to vector store at ${process.env.VECTOR_STORE_URL_COHERE}...`)
      console.log(`cohereApiKey: ${process.env.COHERE_API_KEY_VECTOR_1}`); // 🆕 dùng Cohere key
      const embeddings = new CohereEmbeddings({
        apiKey: process.env.COHERE_API_KEY_VECTOR_1, // 🔑 dùng key của Cohere
        model: 'embed-multilingual-v3.0' // embed-v4.0	
      });

      const store = await PGVectorStore.initialize(embeddings, {
        postgresConnectionOptions: {
          connectionString: process.env.VECTOR_STORE_URL_COHERE,
        },
        tableName: collectionName,
      });

      return store;
    } catch (error) {
      this.logger.error(`❌ Failed to initialize vector store: ${error.message}`);
      throw error;
    }
  }

  async embedDocuments(documents: Document[], collectionName: string): Promise<void> {
    const BATCH_SIZE = 100;
    const DELAY_MS = 1500;

    try {
      const store = await this.getVectorStore(collectionName);

      for (let i = 0; i < documents.length; i += BATCH_SIZE) {
        const batch = documents.slice(i, i + BATCH_SIZE);
        this.logger.log(`🚀 Embedding batch ${i / BATCH_SIZE + 1} (${batch.length} documents)...`);
        await store.addDocuments(batch);
        await new Promise((resolve) => setTimeout(resolve, DELAY_MS));
      }

      this.logger.log(`✅ Successfully embedded ${documents.length} documents to collection '${collectionName}'.`);
    } catch (error) {
      console.error(`❌ Error embedding documents: ${error.message}`);
      this.logger.error(`❌ Failed to embed documents: ${error.message}`);
    }
  }
}
