import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/infrastructure/database/prisma/prisma.service";
import { BaseRepository } from "src/shared/repo/base.repository";
import { Ticket, TicketRepository } from "./ticket.repo";
import { Prisma } from "@prisma/client";
import { Result, Ok, Err } from "oxide.ts";
import { SubmitFormDto } from "../../modules/commands/submitForm/submitForm.dto";
import { GetFormResponseService } from "src/services/event-svc/modules/formResponse/queries/getFormResponse/getFormResponse.service";
import { CreateFormResponseService } from "src/services/event-svc/modules/formResponse/commands/createFormResponse/createFormResponse.service";
import { UpdateFormResponseService } from "src/services/event-svc/modules/formResponse/commands/updateFormResponse/updateFormResponse.service";
import { DeleteFormAnswerService } from "src/services/event-svc/modules/formAnswer/commands/deleteFormAnswer/deleteFormAnswer.service";
import { GetFormByIdService } from "src/services/event-svc/modules/form/queries/getFormById/getFormById.service";
import { GetManyFormInputsByIdService } from "src/services/event-svc/modules/formInput/queries/getManyFormInputsById/getManyFormInputsById.service";

@Injectable()
export class TicketRepositoryImpl
  extends BaseRepository<Ticket, Prisma.TicketDelegate>
  implements TicketRepository
{
  constructor(
    protected readonly prisma: PrismaService,
    private readonly getFormResponseService: GetFormResponseService,
    private readonly createFormResponseService: CreateFormResponseService,
    private readonly updateFormResponseService: UpdateFormResponseService,
    private readonly deleteFormAnswerService: DeleteFormAnswerService,
    private readonly getFormByIdService: GetFormByIdService,
    private readonly getManyFormInputsByIdService: GetManyFormInputsByIdService
  ) {
    super(prisma.ticket, prisma);
  }

  countCheckedInTickets(ticketTypeIds: string[]): Promise<number> {
    return this.prisma.ticket.count({
      where: {
        ticketTypeId: { in: ticketTypeIds },
        isCheckedIn: true,
      },
    });
  }
  // Thêm các phương thức riêng cho Ticket nếu cần

  async submitForm(dto: SubmitFormDto, userId: string): Promise<Result<any, Error>> {
    try {
      const existForm = await this.getFormResponseService.execute(userId, Number(dto.formId), dto.showingId);

      if (existForm.isErr()) {
        return Err(new Error(existForm.unwrapErr().message));
      }

      const formResponse = existForm.unwrap();
      
      if (formResponse) {
        await this.deleteFormAnswerService.execute(Number(formResponse?.id));

        const updated = await this.updateFormResponseService.execute({ answers: dto.answers }, userId);
        if (updated.isErr()) {
          return Err(new Error(updated.unwrapErr().message));
        }

        return Ok(updated);
      }

      const created = await this.createFormResponseService.execute(dto, userId);

      if (created.isErr()) {
        return Err(new Error(created.unwrapErr().message));
      }

      return Ok(created);
    } catch (error) {
      return Err(new Error('Failed to submit form'));
    }
  }

  async checkValidForm(dto: SubmitFormDto): Promise<Result<boolean, Error>> {
    try {
      const form = await this.getFormByIdService.execute(Number(dto.formId));

      if (form.isErr()) {
        return Err(new Error(form.unwrapErr().message));
      }

      if (!form.unwrap()) {
        return Ok(false);
      }

      const formInputsResponse = await this.getManyFormInputsByIdService.execute(Number(dto.formId));

      if (formInputsResponse.isErr()) {
        return Err(new Error(formInputsResponse.unwrapErr().message));
      }

      const formInputs = formInputsResponse.unwrap();

      for (const answer of dto.answers) {
        const formInput = formInputs.find((input) => input.id === answer.formInputId);
        if (!formInput) {
          return Ok(false);
        }

        const regex = new RegExp(formInput.regex);

        if (formInput.regex && !regex.test(answer.value)) {
          return Ok(false);
        }

        if (formInput.required && !answer.value) {
          return Ok(false);
        }
      }

      return Ok(true);
    } catch (error) {
      return Err(new Error('Failed to check valid form'));
    }
  }
}