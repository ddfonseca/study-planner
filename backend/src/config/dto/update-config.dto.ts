import { IsOptional, IsNumber, Min } from 'class-validator';

export class UpdateConfigDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  targetHours?: number;
}
