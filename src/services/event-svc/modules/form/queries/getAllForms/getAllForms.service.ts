import { Inject, Injectable } from '@nestjs/common';
import { Result, Ok, Err } from 'oxide.ts';
import { FormRepository } from 'src/services/event-svc/repository/form/form.repo';
import { BasicFormDto } from './getAllFroms-response.dto';

@Injectable()
export class GetAllFormsService {
constructor(
    @Inject('FormRepository') private readonly formRepository: FormRepository
  ) {}

  async execute(organizerEmail: string): Promise<Result<BasicFormDto[], Error>> {
    try {
      const forms = await this.formRepository.findAllByOrganizerEmail(organizerEmail);
      return Ok(forms);
    } catch (error) {
      return Err(new Error('Failed to retrieve forms'));
    }
  }
}