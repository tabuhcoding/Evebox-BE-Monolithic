import { Controller, Get, Post, Delete, Body, Param, HttpStatus, Res } from '@nestjs/common';
import { GetAllDistrictsService } from './getAllDistricts.service';
import { Response } from 'express';
import { ApiOperation, ApiProperty, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { GetAllDistrictsResponseDto } from './getAllDistricts-response.dto';

@ApiTags('Event Service - Location')
@Controller('api/')
export class GetAllDistrictsController {
  constructor(private readonly getAllDistrictsService: GetAllDistrictsService) {}

  @Get('/location/all-districts')
  @ApiOperation({ summary: 'Get all districts and province' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Districts and province retrieved successfully', type: GetAllDistrictsResponseDto })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Internal server error' })
  async findAll(@Res() res: Response) {
   try{
      const result = await this.getAllDistrictsService.getAllDistricts();
      return res.status(HttpStatus.OK).json(result.unwrap());
    } catch (error) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Internal server error',
      });
   }
  }
}
