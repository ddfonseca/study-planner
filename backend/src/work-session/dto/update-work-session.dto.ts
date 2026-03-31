import { IsOptional, IsString, IsInt, Min } from 'class-validator';

export class UpdateWorkSessionDto {
  @IsOptional()
  @IsString()
  subjectId?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  minutes?: number;
}
