import {
  IsString,
  IsOptional,
  IsArray,
  IsBoolean,
  ValidateNested,
  IsInt,
  Min,
  Max,
  MaxLength,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateCycleItemDto {
  @IsString()
  @MaxLength(100)
  subject: string;

  @IsInt()
  @Min(1)
  @Max(1440) // Max 24 hours
  targetMinutes: number;
}

export class CreateStudyCycleDto {
  @IsString()
  @MaxLength(50)
  name: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateCycleItemDto)
  items: CreateCycleItemDto[];

  @IsBoolean()
  @IsOptional()
  activateOnCreate?: boolean;
}
