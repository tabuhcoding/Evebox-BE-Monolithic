import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
// import { OpenAIEmbeddings } from '@langchain/openai';
import { PGVectorStore } from '@langchain/community/vectorstores/pgvector';
import { Document } from 'langchain/document';
import { SlackService } from 'src/infrastructure/adapters/slack/slack.service';
import { TrackedOpenAIEmbeddings } from '../domain/track-openAI';

@Injectable()
export class OpenAIEmbeddingWrapperService {
  constructor(
    private readonly slackService: SlackService,
  ) {}

  private readonly apiKey = process.env.OPENAI_API_KEY_VECTOR;
  private readonly collectionUrl = process.env.DATABASE_URL_AI;
  private readonly model = 'text-embedding-3-small';
  private storeMap = new Map<string, PGVectorStore>();

  private async initStore(collectionName: string): Promise<PGVectorStore> {
    const embeddings = new TrackedOpenAIEmbeddings(this.apiKey, this.model,this.slackService);

    return await PGVectorStore.initialize(embeddings, {
      postgresConnectionOptions: {
        connectionString: this.collectionUrl,
      },
      tableName: collectionName,
    });
  }

  private async getOrCreateStore(collectionName: string): Promise<PGVectorStore> {
    if (this.storeMap.has(collectionName)) {
      return this.storeMap.get(collectionName)!;
    }
    const embeddings = new TrackedOpenAIEmbeddings(this.apiKey, this.model,this.slackService);
    const store = await PGVectorStore.initialize(embeddings, {
      postgresConnectionOptions: { connectionString: this.collectionUrl },
      tableName: collectionName,
    });

    this.storeMap.set(collectionName, store);
    await this.slackService.sendNotice(`Initialized store for collection: ${collectionName}`);
    return store;
  }
    
  async embedDocuments(documents: Document[], collectionName: string): Promise<void> {
    const BATCH_SIZE = 100;
    const DELAY_MS = 500;

    try {
      const store = await this.initStore(collectionName);

      for (let i = 0; i < documents.length; i += BATCH_SIZE) {
        const batch = documents.slice(i, i + BATCH_SIZE);
        await store.addDocuments(batch);
        await new Promise((r) => setTimeout(r, DELAY_MS));
        await this.slackService.sendNotice(`Embedded batch ${Math.floor(i / BATCH_SIZE) + 1} of ${Math.ceil(documents.length / BATCH_SIZE)} for collection: ${collectionName}`);
      }

      await this.slackService.sendNotice(`✅ Successfully embedded ${documents.length} documents into collection: ${collectionName}`);
    } catch (err) {
      await this.slackService.sendError(`❌ Embedding failed for collection ${collectionName}: ${err.message}`);
      throw err;
    }
  }

  async searchByText(query: string, collectionName: string, k = 5) {
    try {
      const store = await this.initStore(collectionName);
      return await store.similaritySearch(query, k);
    } catch (err) {
      await this.slackService.sendError(`❌ Text search error: ${err.message}`);
      throw err;
    }
  }

  async searchByVector(vector: number[], collectionName: string, k = 10) {
    try {
      const store = await this.initStore(collectionName);
      return await store.similaritySearchVectorWithScore(vector, k);
    } catch (err) {
      await this.slackService.sendError(`❌ Vector search error: ${err.message}`);
      throw err;
    }
  }
}
