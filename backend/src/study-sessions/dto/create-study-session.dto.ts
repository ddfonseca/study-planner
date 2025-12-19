import { IsNotEmpty, IsString, IsInt, Min, IsDateString } from 'class-validator';

export class CreateStudySessionDto {
  @IsDateString()
  @IsNotEmpty()
  date: string;

  @IsString()
  @IsNotEmpty()
  subject: string;

  @IsInt()
  @Min(1)
  minutes: number;
}
