import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class CreateCategoryDto {
  @ApiProperty({ example: '', description: 'Name' })
  @IsString()
  name: string;

  @ApiProperty({ example: '', description: 'Image URL', required: false })
  @IsOptional()
  @IsString()
  image_url?: string;
}

export class UpdateCategoryDto {
  @ApiProperty({ example: '', description: 'Name', required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ example: '', description: 'Image URL', required: false })
  @IsOptional()
  @IsString()
  image_url?: string;
}
