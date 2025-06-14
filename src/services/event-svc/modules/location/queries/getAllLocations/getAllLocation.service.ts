import { Inject, Injectable } from "@nestjs/common";
import { LocationsRepository } from "../../../../repository/locations/location.repo";
import { Err, Ok, Result } from "oxide.ts";
import { GetAllLocationsResponseDto } from "./getAllLocation-response.dto";
import { GetAdminAccessService } from "src/services/auth-svc/modules/user/queries/get-admin-access/get-admin-access.service";

@Injectable()
export class GetAllLocationsService {
  constructor(
    @Inject('LocationsRepository') private readonly locationsRepository: LocationsRepository,
    private readonly getAdminAccessService: GetAdminAccessService,
  ) {}

  async getAllLocations(email: string, organizerId?: string, provinceId?: number): Promise<Result<GetAllLocationsResponseDto, Error>> {
    const isAdmin = await this.getAdminAccessService.execute(email);
    if (!isAdmin) {
      return Err(new Error('Access denied. Admins only.'));
    }

    try {
      const locations = await this.locationsRepository.getAllLocations(organizerId, provinceId);
      return Ok({
        statusCode: 200,
        message: 'Locations retrieved successfully',
        data: locations,
      });
    } catch (error) {
          console.error('[GetAllLocationsService] ERROR:', error); // ← LOG HERE
          return Err(error);
      // return Err(new Error('Failed to retrieve locations'));
    }
  }
}
