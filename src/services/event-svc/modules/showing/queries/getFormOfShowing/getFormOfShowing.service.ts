import { Inject, Injectable } from "@nestjs/common";
import { Result, Ok, Err } from "oxide.ts";
import { GetFormOfShowingDataDto } from "./getFomrOfShowing-response.dto";
import { FormRepository } from "src/services/event-svc/repository/form/form.repo";

@Injectable()
export class getFormOfShowingService {
  constructor (
    @Inject('FormRepository') private readonly formRepository: FormRepository,
  ) {}

  async execute(showingId: string): Promise<Result<GetFormOfShowingDataDto, Error>> {
    try {
      const form = await this.formRepository.findOne({
        Showing: {
          some: {
            id: showingId,
            deleteAt: null,
            endTime: {
              gte: new Date(),
            },
          },
        }
      },
      {
        FormInput: true,
      });
      if (!form) {
        return Ok(null);
      }
      return Ok(form);
    } catch (error) {
      console.error(error);
      return Err(new Error('Failed to fetch form data.'));
    }
  }
}