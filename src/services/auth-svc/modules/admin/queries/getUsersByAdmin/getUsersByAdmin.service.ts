import { Inject, Injectable } from "@nestjs/common";
import { Result, Ok, Err } from "oxide.ts";
import { UserDto } from "./getUsersByAdmin-response.dto";
import { SlackService } from "src/infrastructure/adapters/slack/slack.service";
import { UserRepository } from "src/services/auth-svc/repository/users/user.repository";
import { CheckUserExistService } from "../../../user/commands/checkuserExist/checkuserExist.service";
import { GetUsersByAdminDto } from "./getUsersByAdmin.dto";
import { Pagination } from "src/shared/constants/pagination";
import { UserRole } from "../../../user/domain/enums/user-role.enum";

@Injectable()
export class GetUsersByAdminService {
  constructor(
    @Inject('UserRepository') private readonly userRepository: UserRepository,
    private readonly checkUserExistService: CheckUserExistService,
    private readonly slackService: SlackService
  ) { }

  async execute(filters: GetUsersByAdminDto, email: string): Promise<Result<[UserDto[], Pagination], Error>> {
    try {
      const isAdminUser = await this.checkUserExistService.checkAdminExist(email);
      if (!isAdminUser) {
        return Err(new Error('Unauthorized: User does not exist or is not an admin'));
      }

      const payloadFilters: any = {};
      if (filters.search) {
        payloadFilters.OR = [
          { name: { contains: filters.search, mode: 'insensitive' } },
          { email: { contains: filters.search, mode: 'insensitive' } }
        ];
      }

      if (filters.role_id !== undefined && filters.role_id !== null) {
        payloadFilters.role_id = Number(filters.role_id);
      }

      if (filters.status) {
        payloadFilters.status = filters.status;
      }

      if (filters.createdFrom || filters.createdTo) {
        payloadFilters.created_at = {};
        if (filters.createdFrom) payloadFilters.created_at.gte = new Date(filters.createdFrom);
        if (filters.createdTo) payloadFilters.created_at.lte = new Date(filters.createdTo);
      }

      const page = filters.page && filters.page > 0 ? filters.page : 1;
      const limit = filters.limit && filters.limit > 0 ? filters.limit : 10;
      const skip = (page - 1) * limit;

      const totalUsers = await this.userRepository.count(payloadFilters);

      if (totalUsers === 0) {
        const emptyPagination: Pagination = { page, limit, totalItems: 0, totalPages: 0 };
        return Ok([[], emptyPagination]);
      }

      const totalPages = Math.ceil(totalUsers / limit);

      const users = await this.userRepository.findMany(
        payloadFilters,
        {
          role: true,
        },
        { created_at: "desc" },
        skip,
        limit
      );

      const userDtos: UserDto[] = users.map(u => {
        let roleObj: { id: number, role_name: string } | null = null;

        if (u.role) {
          if ('id' in u.role && 'role_name' in u.role) {
            roleObj = { id: Number(u.role.id), role_name: String(u.role.role_name) };
          }
          else if (typeof u.role.getValue === 'function') {
            const roleValue = u.role.getValue();
            roleObj = { id: roleValue, role_name: UserRole[roleValue] };
          }
        }

        return {
          id: typeof u.id === 'object' && 'value' in u.id ? u.id.value : u.id,
          name: typeof u.name === 'object' && 'value' in u.name ? u.name.value : u.name,
          email: typeof u.email === 'object' && 'value' in u.email ? u.email.value : u.email,
          status: typeof u.status === 'object' && typeof u.status.getValue === 'function'
            ? String(u.status.getValue())
            : String(u.status),
          role: roleObj,
          created_at: u.created_at
            ? new Date(u.created_at).toISOString()
            : u.created_at
              ? new Date(u.created_at).toISOString()
              : "",
        };
      });

      const pagination: Pagination = {
        page,
        limit,
        totalItems: totalUsers,
        totalPages
      };

      return Ok([userDtos, pagination]);
    } catch (error) {
      await this.slackService.sendError(`Auth Svc >>> GetUsersByAdminService: ${error.message}`);
      return Err(new Error('Internal server error'));
    }
  }
}