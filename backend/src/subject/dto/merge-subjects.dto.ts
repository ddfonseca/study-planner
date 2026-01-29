import { IsNotEmpty, IsString, IsArray, ArrayMinSize } from 'class-validator';

export class MergeSubjectsDto {
  @IsArray()
  @ArrayMinSize(2)
  @IsString({ each: true })
  sourceIds: string[];

  @IsString()
  @IsNotEmpty()
  targetId: string;
}
