import { Injectable } from '@nestjs/common';
import { Result, Ok, Err } from 'oxide.ts';
import { FileCacheService } from 'src/infrastructure/cache/fileCache/fileCache.service';

@Injectable()
export class UnSelectSeatService {
  constructor(
    private readonly fileCache: FileCacheService,
  ) {}
  async execute(showingId: string, email: string): Promise<Result<Boolean, Error>> {
    try {
      await this.fileCache.clearObject(
        'selectTicket',
        {
          showingId: showingId,
        },
        email,
      )

      return Ok(true);
    } catch (error) {
      console.error(error);
      return Err(new Error('Failed to unselect seat'));
    }
  } 
}