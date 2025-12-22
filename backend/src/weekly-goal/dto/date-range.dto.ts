import { IsDateString, IsOptional, IsString } from 'class-validator';

export class DateRangeDto {
  @IsOptional()
  @IsString()
  workspaceId?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}
