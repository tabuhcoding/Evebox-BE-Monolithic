import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/infrastructure/database/prisma/prisma.service";
import { BaseRepository } from "src/shared/repo/base.repository";
import { Form, FormRepository } from "./form.repo";
import { Prisma } from "@prisma/client";
import { Result, Ok, Err } from "oxide.ts";
import { CreateFormDto } from "../../modules/form/commands/createForm/createForm.dto";
import { UpdateFormDto, UpdateFormInputDto } from "../../modules/form/commands/updateForm/updateForm.dto";

@Injectable()
export class FormRepositoryImpl
  extends BaseRepository<Form, Prisma.FormDelegate>
  implements FormRepository {
  constructor(protected readonly prisma: PrismaService) {
    super(prisma.form, prisma);
  }

  async checkAuthor(id: number, userId: string): Promise<Result<boolean, Error>> {
    try {
      const form = await this.findOneById(Number(id));

      if (form && form.createdBy === userId) {
        return Ok(true);
      }

      return Ok(false);
    } catch (error) {
      return Err(new Error(`Failed to check author: ${error.message}`));
    }
  }

  async createForm(dto: CreateFormDto, userEmail: string): Promise<Result<string, Error>> {
    try {
      const createdFormId = await this.insertOne({
        name: dto.name,
        createdBy: userEmail,
        FormInput: {
          create: dto.formInputs.map((input) => ({
            fieldName: input.fieldName,
            type: input.type,
            required: input.required,
            regex: input.regex,
            options: input.options
          }))
        }
      });

      if (!createdFormId) {
        return Err(new Error('Failed to create form'));
      }

      return Ok(createdFormId);
    } catch (error) {
      console.error(`Failed to create form: ${error.message}`);
      return Err(new Error(`Failed to create form: ${error.message}`));
    }
  }

  async updateForm(dto: UpdateFormDto & { id: number; }): Promise<Result<number, Error>> {
    try {
      const existingForm = await this.findOne(
        {
          id: dto.id,
          deleteAt: null,
          ...(dto.showingId && {
            Showing: {
              some: {
                id: dto.showingId
              }
            }
          })
        },
        {
          FormInput: true
        }
      );

      if (!existingForm) {
        return Err(new Error('Form not found or does not belong to the specified showing'));
      }

      const updatedData: any = {};
      if (dto.name !== undefined) {
        updatedData.name = dto.name;
      }

      // handle form inputs: classify inputs into create, update, and delete
      let formInputsToCreate: UpdateFormInputDto[] = [];
      let formInputsToUpdate: UpdateFormInputDto[] = [];
      let formInputIdsToDelete: number[] = [];

      if (dto.formInputs) {
        const existingFormInputIds = existingForm.FormInput
          .filter(input => input.deleteAt === null)
          .map((input) => input.id);
        const newInputIds = dto.formInputs.filter((fi) => fi.id).map((fi) => fi.id);

        // identify old inputs to delete
        formInputIdsToDelete = existingFormInputIds.filter((id) => !newInputIds.includes(id));

        // classify new inputs into create and update
        for (const input of dto.formInputs) {
          if (input.id && existingFormInputIds.includes(input.id)) {
            formInputsToUpdate.push(input);
          } else {
            formInputsToCreate.push(input);
          }
        }
      }

      await this.prisma.$transaction(async (tx) => {
        await tx.form.update({
          where: { id: dto.id },
          data: updatedData
        });

        if (formInputIdsToDelete.length > 0) {
          await tx.formInput.updateMany({
            where: { id: { in: formInputIdsToDelete } },
            data: { deleteAt: new Date() }
          });
        }

        for (const input of formInputsToUpdate) {
          const updateObj: any = {};
          if (input.fieldName !== undefined) updateObj.fieldName = input.fieldName;
          if (input.type !== undefined) updateObj.type = input.type;
          if (input.required !== undefined) updateObj.required = input.required;
          if (input.regex !== undefined) updateObj.regex = input.regex;
          if (input.options !== undefined) updateObj.options = input.options;

          await tx.formInput.update({
            where: { id: input.id },
            data: updateObj
          });
        }

        if (formInputsToCreate.length > 0) {
          await tx.formInput.createMany({
            data: formInputsToCreate.map((input) => ({
              formId: dto.id,
              fieldName: input.fieldName,
              type: input.type,
              required: input.required,
              regex: input.regex,
              options: input.options,
            }))
          });
        }
      });

      return Ok(dto.id);
    } catch (error) {
      console.error(`Failed to update form: ${error.message}`);
      return Err(new Error(`Failed to update form: ${error.message}`));
    }
  }

  async deleteForm(id: number): Promise<Result<number, Error>> {
    try {
      const form = await this.findOne({
        id: Number(id),
        deleteAt: null
      });

      if (!form) {
        return Err(new Error('Form has been deleted already.'));
      }

      await this.prisma.$transaction(async (tx) => {
        // Soft delete FormInput: cập nhật deleteAt cho tất cả các FormInput chưa bị xoá
        await tx.formInput.updateMany({
          where: { formId: Number(id), deleteAt: null },
          data: { deleteAt: new Date() },
        });
        // Soft delete Form: cập nhật deleteAt
        await tx.form.update({
          where: { id: Number(id) },
          data: { deleteAt: new Date() },
        });
      });

      return Ok(id);
    } catch (error) {
      console.error(`Failed to delete form: ${error.message}`);
      return Err(new Error(`Failed to delete form: ${error.message}`));
    }
  }
}