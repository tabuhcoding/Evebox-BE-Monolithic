import { ApiProperty } from "@nestjs/swagger";
import { BaseResponse } from "src/shared/constants/baseResponse";
import { RouteEnum } from "src/shared/utils/rag/navigation.enum";

export class NavigationResponseDTO {
  @ApiProperty({
    description: 'The selected route for navigation',
    example: 'selected_route',
  })
  Route: string;

  @ApiProperty({
    description: 'A brief explanation of the selected route',
    example: 'brief explanation of the route',
  })
  Message: string;
  
  @ApiProperty({
    description: 'Next prompt for search or null if not applicable',
    example: 'next prompt for search or null if not applicable',
    required: false,
  })
  NextPrompt?: string | null;

  @ApiProperty({
    description: 'ID of the previous response, if any',
    example: 'previous_response_id',
    required: false,
  })
  PreviousResponseId?: string;

  @ApiProperty({
    description: 'List of event IDs related to the navigation',
    example: [1, 2, 3],
    required: false,
  })
  EventIds?: number[];
}

export class NavigationResponse extends BaseResponse {
  @ApiProperty({
    type: NavigationResponseDTO,
    description: 'The navigation response containing route, message, next prompt, and event IDs',
  })
  data: NavigationResponseDTO;
}