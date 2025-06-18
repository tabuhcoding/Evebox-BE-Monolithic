import { Inject, Injectable } from '@nestjs/common';
import { Result, Ok, Err } from 'oxide.ts';
import { GetOrgLocationsResponseDto, LocationDto } from './getOrgLocations-response.dto';
import { EventsRepository } from 'src/services/event-svc/repository/events/events.repo';
import { LocationsRepository } from "../../../../repository/locations/location.repo";

@Injectable()
export class GetOrgLocationsService {
  constructor(
    @Inject('EventsRepository') private readonly eventsRepo: EventsRepository,
    @Inject('LocationsRepository') private readonly locationRepo: LocationsRepository,
  ) {}

  async getLocationsByOrganizerEmail(email: string): Promise<Result<GetOrgLocationsResponseDto, Error>> {
    try {
      const events = await this.eventsRepo.findEventsByOrganizerEmail(email);

      var results: LocationDto[] = [];
      for (const event of events) {
        if (!event.locationId) {
          continue; // Skip events without a location
        }
        const location = await this.locationRepo.getLocationWithDistrictAndProvince(event.locationId);
        if (!location) {
          continue; // Skip events with invalid locations
        }
        
        results.push({
          id: location.id,
          street: location.street,
          ward: location.ward,
          district: location.districts.name,
          province: location.districts.province.name,
          venue: event.venue || '',
        });
      }

      const data = results.filter(Boolean);

      return Ok({
        statusCode: 200,
        message: 'Locations retrieved successfully',
        data: data,
      });
    } catch {
      return Err(new Error('Failed to retrieve organizer locations'));
    }
  }
}
