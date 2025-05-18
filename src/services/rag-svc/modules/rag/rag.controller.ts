// src/controllers/rag.controller.ts
import { Controller, Post, Body, Query } from '@nestjs/common';
import { RAGService } from './rag.service';

@Controller('rag')
export class RAGController {
  constructor(private readonly ragService: RAGService) {}
  
  // @Post()
  // async ragQA(
  //   @Query('query') query: string,
  // ) {

  //   const {answer, context } = await this.ragService.askQuestion(
  //     query,
  //     ""
  //   );

  //   return { answer, context };
  // }
}
