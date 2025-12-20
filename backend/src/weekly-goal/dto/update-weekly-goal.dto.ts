import { IsNumber, IsOptional, Min } from 'class-validator';

export class UpdateWeeklyGoalDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  minHours?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  desHours?: number;
}
