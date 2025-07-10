import { Injectable } from '@nestjs/common';
import { z } from 'zod';
import { CreateResponseService } from '../../provider/create-response.service';
import { SlackService } from 'src/infrastructure/adapters/slack/slack.service';
const checkUpdateSchema = z.object({
    isApproved: z.boolean(),
    message: z.string(),
});

export type CheckUpdateEventResult = z.infer<typeof checkUpdateSchema>;

@Injectable()
export class CheckUpdateEventService {
    constructor(
        private readonly createResponseService: CreateResponseService,
        private readonly slackService: SlackService,
    ) {}
    async checkUpdateEvent(newTitle: string, newDescription: string, oldTitle: string, oldDescription: string): Promise<CheckUpdateEventResult> {
        const systemPrompt = `You are an expert in event moderation and approval. Your task is to determine whether an updated event title and description should be approved, based on the previous version of the event.
            You must check the following **two conditions**:

            ---

            **1. Sensitive Content Check**  
            Reject the update if the new **title** or **description** contains any sensitive, inappropriate, or restricted content, including but not limited to:
            - Violence
            - Hate speech
            - Discrimination
            - Adult content
            - Political extremism
            - Illegal activity

            ---

            **2. Semantic Similarity Check**  
            Determine whether the **new title and description still refer to the same event** as the original version:
            - If the content has changed so much that it now appears to describe a **completely different event**, the update should be rejected.
            - Accept small edits, clarifications, or enhancements that preserve the core meaning and identity of the original event.
            You must return the 2 values below:
            {
            "isApproved": true | false,
            "message": "Reason for approval or rejection"
            }

            **Rules:**
            - If the update contains sensitive content, return:
            {
            "isApproved": false,
            "message": "Event contains sensitive words, the words are: [list of sensitive words]"
            }

            - If the update appears to describe a completely different event, return:
            {
            "isApproved": false,
            "message": "You have changed the title and description so much that it seems to be describing a completely different event. Please provide a new event instead."
            }

            - If **both conditions** fail, return:
            {
            "isApproved": false,
            "message": "Event contains sensitive words, the words are: [list of sensitive words]. You have changed the title and description so much that it seems to be describing a completely different event. Please provide a new event instead."
            }

            - If none of the issues above apply, return:
            {
            "isApproved": true,
            "message": "Approved"
            }
            `;

        const userPrompt = `New Title: ${newTitle}
        New Description: ${newDescription}
        Old Title: ${oldTitle}
        Old Description: ${oldDescription}`;

        try {
            const response = await this.createResponseService.generateContent({
                systemPrompt,
                userPrompt,
                model: 'gpt-4o-mini',
                temperature: 0.2,
                topP: 1,
                schema: checkUpdateSchema,
            });

            if (!response || !response.result) {
                throw new Error('Server internal error');
            }

            await this.slackService.sendNotice(`CheckUpdateEvent result: ${JSON.stringify(response)}`);

            const result = response.result as CheckUpdateEventResult;
            if (!result.isApproved) {
                await this.slackService.sendNotice(`CheckUpdateEvent rejected: ${result.message}`);
            } else {
                await this.slackService.sendNotice(`CheckUpdateEvent approved: ${result.message}`);
            }

            return result;
        }
        catch (error) {
            this.slackService.sendError(`CheckUpdateEvent error: ${error.message}`);
            throw new Error(`CheckUpdateEvent failed: Internal server error. Please try again later.`);
        }
    }
}