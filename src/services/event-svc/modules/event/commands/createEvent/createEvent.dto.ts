import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsOptional, IsNumber, IsArray, ArrayNotEmpty, IsBoolean} from "class-validator";

export class CreateEventDto {
  @ApiProperty({ example: 'Tech Conference 2025', description: 'Title of the event' })
  @IsString({message: 'Title must be a string'})
  title: string;

  @ApiProperty({ example: 'A technology conference for developers', description: 'Event description', required: false })
  @IsString({message: 'Description must be a string'})
  @IsOptional()
  description?: string;

  @ApiProperty({ example: false, description: 'Event is online?' })
  @IsOptional()
  @IsBoolean({ message: 'Showing type must be a boolean' })
  isOnline: boolean;

  @ApiProperty({ example: 1, required: false, description: 'District ID nếu offline' })
  @IsNumber()
  @IsOptional()
  districtId?: number;

  @ApiProperty({ example: "Phuong 3", required: false })
  @IsString()
  @IsOptional()
  wardString?: string;

  @ApiProperty({ example: "10 To Hien Thanh", required: false })
  @IsString()
  @IsOptional()
  streetString?: string;

  @ApiProperty({ example: "San khau Thien Dang" })
  @IsString()
  venue: string;

  @ApiProperty({ example: 'Nha hat kich Sai Gon' })
  @IsString()
  orgName: string;

  @ApiProperty({ example: 'Thanh lap nam 2010' })
  @IsString()
  orgDescription: string;

  @ApiProperty({ example: [1, 2], description: 'Array of category IDs' })
  @IsArray()
  @ArrayNotEmpty()
  @IsNumber({}, { each: true })
  categoryIds: number[];

  @ApiProperty({ example: "https://domain.com/image1.png", description: "Event logo URL" })
  @IsString()
  imgLogoUrl: string;

  @ApiProperty({ example: "https://domain.com/image2.png", description: "Event poster URL" })
  @IsString()
  imgPosterUrl: string;

  @ApiProperty({ example: true })
  @IsBoolean()
  isApproved: boolean;
}