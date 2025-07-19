import { Injectable, Logger } from '@nestjs/common';
import { Document } from 'langchain/document';
import { OpenAIEmbeddingWrapperService } from './embedding-wrapper';
import { PrismaAIService } from '../../../database/prisma-ai/prisma.service';
import { SlackService } from 'src/infrastructure/adapters/slack/slack.service';
import { GetAllEventDetailForRAGResponseDto } from 'src/services/event-svc/modules/event/queries/getAllEventDetailForRAG/getAllEventDetailForRAG-response.dto';
import { EventDocumentBuilder } from './event-document.builder';
import { countTokens } from '../domain/track-openAI';
import e from 'express';

@Injectable()
export class OpenAIVectorStoreService {
  private readonly FULL_COLLECTION = 'event_full_openai';
  private readonly SIMILARITY_COLLECTION = 'event_similarity_openai';

  constructor(
    private readonly embeddingWrapperService: OpenAIEmbeddingWrapperService,
    private readonly prisma: PrismaAIService,
    private readonly slackService: SlackService,
  ) {}

  /** Truncate EventDescription If Reach Limit Token */
  truncateEventDescriptionIfNeeded(
    event: GetAllEventDetailForRAGResponseDto,
    maxTokens = 8192, // Default max tokens for OpenAI models
  ): Document {
    const doc = EventDocumentBuilder.buildFullDocument(event);
    const description = event.description || '';
    const currentTokens = countTokens(doc.pageContent, 'text-embedding-3-small');

    if (currentTokens > maxTokens) {
      this.slackService.sendError(`✅ Event ${event.id} description is within token limit: ${currentTokens} tokens`);
      const truncatedDescription = description.slice(0, description.length * 0.8);
      const truncatedShowings = event.showingTimes.slice(0, event.showingTimes.length - 2);
      return this.truncateEventDescriptionIfNeeded({
        ...event,
        description: truncatedDescription,
        showingTimes: truncatedShowings,
      });
    }
    return doc;
  }

  truncateSimilarEventDescriptionIfNeeded(
    event: GetAllEventDetailForRAGResponseDto,
    maxTokens = 8192, // Default max tokens for OpenAI models
  ): Document {
    const doc = EventDocumentBuilder.buildSimilarityDocument(event);
    const description = event.description || '';
    const currentTokens = countTokens(doc.pageContent, 'text-embedding-3-small');

    if (currentTokens > maxTokens) {
      this.slackService.sendError(`✅ Event ${event.id} description is within token limit: ${currentTokens} tokens`);
      const truncatedDescription = description.slice(0, description.length * 0.8);
      const truncatedShowings = event.showingTimes.slice(0, event.showingTimes.length - 2);
      return this.truncateSimilarEventDescriptionIfNeeded({
        ...event,
        description: truncatedDescription,
        showingTimes: truncatedShowings,
      });
    }
    return doc;
  }

  /** Embed full content for prompt-based search */
  async embedFullEventDocuments(events: GetAllEventDetailForRAGResponseDto[]): Promise<void> {
    try {
      // Delete existing vectors for these events
      const eventIds = events.map(e => e.id.toString());
      await this.prisma.$executeRawUnsafe(`
        DELETE FROM ${this.FULL_COLLECTION}
        WHERE metadata->>'eventId' IN (${eventIds.map((_, i) => `$${i + 1}`).join(',')})
      `, ...eventIds);

      // Embed documents
      const docs = await Promise.all(events.map(event => {
        return this.truncateEventDescriptionIfNeeded(event, 8192);
      }));
      await this.embeddingWrapperService.embedDocuments(docs, this.FULL_COLLECTION);
    } catch (error) {
      if ( error.message.includes('Please reduce your prompt')) {
        events.forEach(event => {
          const tokens = countTokens(event.description || '', 'text-embedding-3-small');
          console.warn(`⚠️ Event ${event.id} description exceeds token limit: ${tokens} tokens`);

          event.description = event.description.slice(0, event.description.length * 0.8);
          event.showingTimes = event.showingTimes.slice(0, event.showingTimes.length - 2);
        });

        // Retry with truncated descriptions
        return this.embedFullEventDocuments(events);
      }

      await this.slackService.sendError(`❌ Embedding failed: ${error.message}`);
    }
  }

  /** Embed for similarity recommendation */
  async embedSimilarityEventDocuments(events: GetAllEventDetailForRAGResponseDto[]): Promise<void> {
    try {
      // Delete existing vectors for these events
      const eventIds = events.map(e => e.id.toString());
      await this.prisma.$executeRawUnsafe(`
        DELETE FROM ${this.SIMILARITY_COLLECTION}
        WHERE metadata->>'eventId' IN (${eventIds.map((_, i) => `${i + 1}`).join(',')})
      `, ...eventIds);

      // Embed documents
      const docs = events.map( event => {
        return this.truncateSimilarEventDescriptionIfNeeded(event, 8192);
      });
      await this.embeddingWrapperService.embedDocuments(docs, this.SIMILARITY_COLLECTION);
    } catch (error) {
      if ( error.message.includes('Please reduce your prompt')) {
        events.forEach(event => {
          const tokens = countTokens(event.description || '', 'text-embedding-3-small');
          console.warn(`⚠️ Event ${event.id} description exceeds token limit: ${tokens} tokens`);

          event.description = event.description.slice(0, event.description.length * 0.8);
          event.showingTimes = event.showingTimes.slice(0, event.showingTimes.length - 2);
        });

        // Retry with truncated descriptions
        return this.embedSimilarityEventDocuments(events);
      }

      await this.slackService.sendError(`❌ Embedding failed: ${error.message}`);
    }
  }

  /** Search with user query prompt */
  async searchEventsByPrompt(prompt: string, topK = 10) {
    return this.embeddingWrapperService.searchByText(prompt, this.FULL_COLLECTION, topK);
  }

  /** Search similar events by text */
  async searchSimilarEventsByText(text: string, topK = 10) {
    return this.embeddingWrapperService.searchByText(text, this.SIMILARITY_COLLECTION, topK);
  }

  /** Get vector for an eventId */
  async getVectorByEventId(eventId: string): Promise<number[] | null> {
    const result = await this.prisma.$queryRawUnsafe<any[]>(`
      SELECT embedding::text AS embedding
      FROM ${this.SIMILARITY_COLLECTION}
      WHERE metadata->>'eventId' = $1
      LIMIT 1;
    `, eventId);

    if (!result?.[0]) return null;

    // Parse the vector string like: "[0.1, 0.2, 0.3]"
    return JSON.parse(result[0].embedding);
  }


  /** Find similar events for a given EventId */
  async findSimilarEventsFromEvent(eventId: string, topK = 10) {
    const vector = await this.getVectorByEventId(eventId);
    if (!vector) {
      await this.slackService.sendError(`❌ No vector found for eventId: ${eventId}`);
      return [];
    }
    return this.embeddingWrapperService.searchByVector(vector, this.SIMILARITY_COLLECTION, topK);
  }

  /** Compute the average vector from a list of vectors */
  averageVectors(vectors: number[][]): number[] {
    if (vectors.length === 0) return [];

    const dim = vectors[0].length;
    const sumVector = Array(dim).fill(0);

    for (const vec of vectors) {
      for (let i = 0; i < dim; i++) {
        sumVector[i] += vec[i];
      }
    }

    return sumVector.map(val => val / vectors.length);
  }


  /** Recommend events based on favorite eventIds */
  async recommendEventsFromFavorites(favoriteIds: string[], topK = 10) {
    if (favoriteIds.length === 0) {
      return [];
    }
    var vectors: number[][] = [];
    for (const favoriteId of favoriteIds) {
      const vector = await this.getVectorByEventId(favoriteId);
      if (vector) {
        vectors.push(vector);
      } else {
        await this.slackService.sendError(`❌ No vector found for favoriteId: ${favoriteId}`);
      }
    }
    const validVectors = vectors.filter(v => Array.isArray(v)) as number[][];

    if (validVectors.length === 0) {
      await this.slackService.sendError(`❌ No valid vectors found for favoriteIds: ${favoriteIds.join(', ')}`);
      return [];
    }

    // Average vector
    const avgVector = this.averageVectors(validVectors);

    return this.embeddingWrapperService.searchByVector(avgVector, this.SIMILARITY_COLLECTION, topK);
  }
}
