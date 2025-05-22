import { Inject, Injectable } from "@nestjs/common";
import { Result, Ok, Err } from "oxide.ts";
import { CloudinaryService } from "src/infrastructure/adapters/cloudinary/cloudinary.service";
import { ImagesRepository } from "src/services/auth-svc/repository/images/images.repo";
import { Images } from "@prisma/client";

@Injectable()
export class ImagesService {
  constructor(
    @Inject('ImagesRepository') private readonly imagesRepository: ImagesRepository,
    private readonly cloudinaryService: CloudinaryService
  ) { }

  async uploadImage(fileBuffer: Buffer, fileName: string, userEmail: string): Promise<Result<Images, Error>> {
    try {
      const uploadResult = await this.cloudinaryService.uploadImage(fileBuffer, fileName);

      const image = await this.imagesRepository.create(uploadResult.secure_url, userEmail);

      return Ok(image);
    } catch (error) {
      return Err(new Error('Failed to upload image'));
    }
  }

  async findAll(userEmail: string): Promise<Result<Images[], Error>> {
    try {
      const images = await this.imagesRepository.findAll(userEmail);
      return Ok(images);
    } catch (error) {
      return Err(new Error('Failed to retrieve images'));
    }
  }

  async findOne(id: number): Promise<Result<Images, Error>> {
    try {
      const image = await this.imagesRepository.findOne(id);
      if (!image) return Err(new Error('Image not found'));
      return Ok(image);
    } catch (error) {
      return Err(new Error('Failed to retrieve image'));
    }
  }

  async update(id: number, fileBuffer: Buffer, fileName: string): Promise<Result<Images, Error>> {
    try {
      const image = await this.imagesRepository.findOne(id);
      if (!image) return Err(new Error('Image not found'));
      const uploadResult = await this.cloudinaryService.uploadImage(fileBuffer, fileName);
      const updatedImage = await this.imagesRepository.update(id, uploadResult.secure_url);
      return Ok(updatedImage);
    } catch (error) {
      return Err(new Error('Failed to update image'));
    }
  }

  async remove(id: number): Promise<Result<void, Error>> {
    try {
      const image = await this.imagesRepository.findOne(id);
      if (!image) return Err(new Error('Image not found'));
      await this.imagesRepository.remove(id);
      return Ok(undefined);
    } catch (error) {
      return Err(new Error('Failed to delete image'));
    }
  }
}