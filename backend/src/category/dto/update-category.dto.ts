import {
  IsString,
  IsOptional,
  MaxLength,
  Matches,
  IsInt,
  Min,
} from 'class-validator';

export class UpdateCategoryDto {
  @IsOptional()
  @IsString()
  @MaxLength(50)
  name?: string;

  @IsOptional()
  @IsString()
  @Matches(/^#[0-9A-Fa-f]{6}$/, {
    message: 'color must be a valid hex color (e.g., #FFFFFF)',
  })
  color?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  position?: number;
}
