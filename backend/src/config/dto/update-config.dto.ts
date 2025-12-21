import { IsOptional, IsNumber, IsInt, Min, Max } from 'class-validator';

export class UpdateConfigDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(168) // Max 168 hours per week
  targetHours?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(6)
  weekStartDay?: number; // 0=Dom, 1=Seg, ..., 6=Sáb
}
