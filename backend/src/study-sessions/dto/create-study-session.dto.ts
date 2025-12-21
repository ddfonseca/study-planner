import {
  IsNotEmpty,
  IsString,
  IsInt,
  Min,
  Max,
  MaxLength,
  IsDateString,
} from 'class-validator';

export class CreateStudySessionDto {
  @IsDateString()
  @IsNotEmpty()
  date: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  subject: string;

  @IsInt()
  @Min(1)
  @Max(1440) // Max 24 hours in minutes
  minutes: number;
}
