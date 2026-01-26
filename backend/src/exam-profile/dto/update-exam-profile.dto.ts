import {
  IsString,
  IsOptional,
  IsArray,
  ValidateNested,
  IsBoolean,
  IsNumber,
  Min,
  Max,
  MaxLength,
  ArrayMinSize,
  IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreateSubjectProfileDto } from './create-exam-profile.dto';

export class UpdateExamProfileDto {
  @IsString()
  @IsOptional()
  @MaxLength(100)
  name?: string;

  @IsDateString()
  @IsOptional()
  examDate?: string;

  @IsNumber()
  @Min(1)
  @Max(168)
  @IsOptional()
  weeklyHours?: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateSubjectProfileDto)
  @IsOptional()
  subjects?: CreateSubjectProfileDto[];
}
