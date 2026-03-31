import { IsArray, IsString, ArrayMinSize } from 'class-validator';

export class ReorderTasksDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  taskIds: string[];
}
