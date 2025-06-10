import { Inject, Injectable } from "@nestjs/common";
import { SlackService } from "src/infrastructure/adapters/slack/slack.service";
import { PreviewShowingDto } from "src/services/booking-svc/modules/queries/getUserOrder/getUserOrder-response.dto";
import { ShowingWithEventRepository } from "src/services/event-svc/repository/showing/showingWithEvent.repo";

@Injectable()
export class GetPreviewShowingService {
  constructor(
    private readonly slackService: SlackService,
    @Inject('ShowingWithEventRepository') private readonly showingRepository: ShowingWithEventRepository,
  ) {}

  async execute(id: string): Promise<PreviewShowingDto | null> {
    try{
      const showing = await this.showingRepository.findOneById(id, {
        Events: true,
      })

      if (!showing) {
        return null;
      }
      const { street, ward, districts } = showing.Events.locations ?? {};
      const districtName = districts?.name || '';
      const provinceName = districts?.province?.name || '';
      const locationsString = `${street || ''}, ${ward || ''}, ${districtName}, ${provinceName}`;
      
      return {
        title: showing.Events.title,
        venue: showing.Events.venue,
        locationsString: locationsString,
        startTime: showing.startTime,
        endTime: showing.endTime,
        imageUrl: showing.Events.imgPosterUrl,
      }
    }
    catch (error) {
      this.slackService.sendError(`Event Svc >>> GetPreviewShowingService : ${error.message}`);
      
      return null;
    }
  }
}