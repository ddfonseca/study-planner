import {
  IsNotEmpty,
  IsString,
  IsInt,
  Min,
  Max,
  IsDateString,
} from 'class-validator';

export class CreateStudySessionDto {
  @IsString()
  @IsNotEmpty()
  workspaceId: string;

  @IsDateString()
  @IsNotEmpty()
  date: string;

  @IsString()
  @IsNotEmpty()
  subjectId: string;

  @IsInt()
  @Min(1)
  @Max(1440) // Max 24 hours in minutes
  minutes: number;
}
