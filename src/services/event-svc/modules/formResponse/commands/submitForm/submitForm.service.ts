import { Inject, Injectable } from "@nestjs/common";
import { SubmitFormDto } from "src/services/booking-svc/modules/commands/submitForm/submitForm.dto";
import { FormResponse, FormResponseRepository } from "src/services/event-svc/repository/formResponse/formResponse.repo";
import { FormAnswerRepository } from "src/services/event-svc/repository/formAnswer/formAnswer.repo";
import { SlackService } from "src/infrastructure/adapters/slack/slack.service";
import { FormRepository } from "src/services/event-svc/repository/form/form.repo";
import { FormInputRepository } from "src/services/event-svc/repository/formInput/formInput.repo";

@Injectable()
export class SubmitFormService {
  constructor(
    @Inject('FormResponseRepository') private readonly formResponseRepository: FormResponseRepository,
    @Inject('FormAnswerRepository') private readonly formAnswerReposiotory: FormAnswerRepository,
    @Inject('FormRepository') private readonly formRepository: FormRepository,  
    @Inject('FormInputRepository') private readonly formInputRepository: FormInputRepository,
    private readonly slackService: SlackService,
  ){}

  async submitForm(dto: SubmitFormDto, userId: string): Promise<FormResponse | Error> {
    try {
      // Find existing form response
      var existForm = await this.formResponseRepository.findOne(
        {
          userId: userId,
          formId: dto.formId >> 0,
          showingId: dto.showingId,
          orderId: null,
        },
      )
      
      if (existForm) {
        // Clear existing answers
        await this.formAnswerReposiotory.deleteHardMany({
          formResponseId: existForm.id,
        })
      }
      else{
        // Create new form response if it doesn't exist
        const newFormResponse = await this.formResponseRepository.insertOneWithNumberId({
          userId: userId,
          formId: dto.formId >> 0,
          showingId: dto.showingId,
          orderId: null,
        })

        if (!newFormResponse) {
          return (new Error('Failed to create new form response'));
        }

        existForm.id = newFormResponse
      }
      // Insert new answers
      const updatedForm = await this.formResponseRepository.updateAndFindOneById(
        existForm.id,
        {
          FormAnswer: {
            create: dto.answers.map((answer) => ({
              formInputId: answer.formInputId,
              value: answer.value,
            }))
          }
        },
        {
          FormAnswer: true
        }
      )

      return (updatedForm);
    } catch (error) {
      this.slackService.sendError(`Event SVC >>> SubmitFormService : ${error.message}`);

      return (new Error('Failed to submit form'));
    }
  }

  async checkValidForm(dto: SubmitFormDto): Promise<boolean> {
    try {
      const form = await this.formRepository.findOneById(dto.formId, {
        FormInputs: true,
      });

      if (!form) {
        this.slackService.sendError(`Event SVC >>> SubmitFormService : Form with id ${dto.formId} not found`);

        return false;
      }

      const formInputs = await this.formInputRepository.findMany({
        formId: dto.formId,
      });

      if (formInputs.length === 0) {
        this.slackService.sendError(`Event SVC >>> SubmitFormService : No form inputs found for form id ${dto.formId}`);

        return false;
      }

      for (const answer of dto.answers) {
        const formInput = formInputs.find((input) => input.id === answer.formInputId);
        if (!formInput) {
          this.slackService.sendError(`Event SVC >>> SubmitFormService : Form input with id ${answer.formInputId} not found in form ${dto.formId}`);

          return (false);
        }

        if (formInput.required && !answer.value) {
          return (false);
        }

        const regex = new RegExp(formInput.regex);

        if (formInput.regex && !regex.test(answer.value)) {
          this.slackService.sendError(`Event SVC >>> SubmitFormService : Answer value "${answer.value}" does not match regex for form input ${formInput.id} in form ${dto.formId}`);
          
          return (false);
        }
      }

      return (true);
    } catch (error) {
      this.slackService.sendError(`Event SVC >>> SubmitFormService : ${error.message}`);

      return (false);
    }
  }
}