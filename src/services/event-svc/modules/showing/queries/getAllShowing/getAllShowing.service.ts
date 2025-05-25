import { Inject, Injectable } from '@nestjs/common';
import { Result, Ok, Err } from 'oxide.ts';
import { ShowingRepository } from 'src/services/event-svc/repository/showing/showing.repo';

@Injectable()
export class getAllShowingService {
  constructor(
    @Inject('ShowingRepository') private readonly showingRepository: ShowingRepository,
  ) {}

  async getAllShowings(): Promise<Result<String[], Error>> {
    try {
      const showings = await this.showingRepository.findMany({});
      const formattedResult = showings.map(showing => showing.id);
      return Ok(formattedResult);
    } catch (error) {
      console.error(error);
      return Err(new Error('Failed to fetch showings data.'));
    }
  }
}