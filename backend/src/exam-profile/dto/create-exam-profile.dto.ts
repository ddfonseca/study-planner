import {
  IsString,
  IsOptional,
  IsArray,
  ValidateNested,
  IsInt,
  IsNumber,
  Min,
  Max,
  MaxLength,
  ArrayMinSize,
  IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateSubjectProfileDto {
  @IsString()
  @MaxLength(100)
  subject: string;

  @IsNumber()
  @Min(0.1)
  @Max(10)
  weight: number;

  @IsInt()
  @Min(0)
  @Max(10)
  currentLevel: number;

  @IsInt()
  @Min(0)
  @Max(10)
  goalLevel: number;

  @IsInt()
  @Min(0)
  position: number;
}

export class CreateExamProfileDto {
  @IsString()
  @MaxLength(100)
  name: string;

  @IsString()
  workspaceId: string;

  @IsDateString()
  examDate: string;

  @IsNumber()
  @Min(1)
  @Max(168) // Max 168 hours per week
  weeklyHours: number;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateSubjectProfileDto)
  subjects: CreateSubjectProfileDto[];
}
