import { IsArray, IsString, ArrayMinSize } from 'class-validator';

export class ReorderSubjectsDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  subjectIds: string[];
}
