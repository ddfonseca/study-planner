import {
  IsNotEmpty,
  IsString,
  IsInt,
  Min,
  Max,
  IsDateString,
} from 'class-validator';

export class CreateWorkSessionDto {
  @IsString()
  @IsNotEmpty()
  workspaceId: string;

  @IsDateString()
  @IsNotEmpty()
  date: string;

  @IsString()
  @IsNotEmpty()
  taskId: string;

  @IsInt()
  @Min(1)
  @Max(1440) // Max 24 hours in minutes
  minutes: number;
}
