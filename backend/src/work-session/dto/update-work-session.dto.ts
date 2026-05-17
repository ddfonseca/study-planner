import { IsOptional, IsString, IsInt, Min } from 'class-validator';

export class UpdateWorkSessionDto {
  @IsOptional()
  @IsString()
  taskId?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  minutes?: number;
}
