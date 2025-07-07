import { Injectable } from "@nestjs/common";
import { CreateResponseService } from "../../provider/create-response.service";
import { SlackService } from "src/infrastructure/adapters/slack/slack.service";
import { OpenAIRouteEnum, RouteDescription } from "../../domain/navigation.enum";
import { FileCacheService } from "src/infrastructure/cache/fileCache/fileCache.service";
import { OpenAIVectorStoreService } from "../../core-embedding/vector-store.service";
import { NavigationResponseDTO } from "./navigation-response.dto";
import { z } from "zod";

const NavigationSchema = z.object({
  Route: z.string(),
  Message: z.string(),
  NextPrompt: z.string().nullable(),
});

export type NavigationResult = z.infer<typeof NavigationSchema>;

@Injectable()
export class OpenAINavigationService {
  constructor(
    private readonly createResponseService: CreateResponseService,
    private readonly slackService: SlackService,
    private readonly vectorStoreService: OpenAIVectorStoreService,
  ) {}

  async selectRoute(query: string, previousID?: string): Promise<NavigationResponseDTO> {
    const systemPrompt = `You are an expert in guiding users through a navigation system. Based on the user's query, select the most appropriate route from the available options.
    Available routes:
    ${
      Object.entries(RouteDescription)
        .map(([key, value]) => `- ${key}: ${value}`)
        .join('\n')
    }
    `;

    const userPrompt = `User query: ${query}
    Based on the query, select the best route and provide a brief explanation of why this route is chosen, maximum 200 characters. Reply in Vietnamese if user Query is Vietnamese.
    If the Previous chat ID is provided, use it to reference the previous conversation context.
    If you choose a Search route, provide a next prompt that can be used to search with Similarity Search to find the Event User is looking for, maximum 50 character in Vietnamese.
    Return the result in JSON format with the following structure:
    {
      "Route": "selected_route",
      "Message": "brief explanation of the route",
      "NextPrompt": "next prompt for search or null if not applicable"
    }
    `;

    try {
      const response = await this.createResponseService.generateContent({
        systemPrompt,
        userPrompt,
        model: 'gpt-4o-mini',
        temperature: 0.2,
        topP: 1,
        schema: NavigationSchema,
        previousResponseId: previousID,
      });

      if (!response || !response.result) {
        throw new Error('Server internal error');
      }

      await this.slackService.sendNotice(`Navigation result: ${JSON.stringify(response)}`);

      const result = response.result as NavigationResult;

      const previousResponseId = response.usage.total_tokens < 20000 ? response.responseId : null;

      if (result.Route === OpenAIRouteEnum.SEARCH_PAGE) {
        if (!result.NextPrompt) {
          throw new Error('Server internal error');
        }

        const events = await this.vectorStoreService.searchEventsByPrompt(result.NextPrompt, 10);
        if (events.length === 0) {
          this.slackService.sendNotice(`No events found.`);
          return;
        }

        const eventIds = events.map(event => event.metadata.eventId);
        this.slackService.sendNotice(`Found ${eventIds.length} events for search prompt: ${result.NextPrompt}`);

        return {
          Route: result.Route,
          Message: result.Message,
          NextPrompt: result.NextPrompt,
          EventIds: eventIds,
          PreviousResponseId: previousResponseId,
        };
      }

      return {
        Route: result.Route,
        Message: result.Message,
        PreviousResponseId: previousResponseId,
      };
    } catch (error) {
      this.slackService.sendError(`Navigation error: ${error.message}`);
      throw new Error(`Navigation failed: Internal server error. Please try again later.`);
    }
  }
}
