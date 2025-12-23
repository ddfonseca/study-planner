import {
  IsString,
  IsOptional,
  IsArray,
  ValidateNested,
  IsBoolean,
  IsInt,
  Min,
  MaxLength,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreateCycleItemDto } from './create-study-cycle.dto';

export class UpdateStudyCycleDto {
  @IsString()
  @IsOptional()
  @MaxLength(50)
  name?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsInt()
  @Min(0)
  @IsOptional()
  currentItemIndex?: number;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateCycleItemDto)
  @IsOptional()
  items?: CreateCycleItemDto[];
}
