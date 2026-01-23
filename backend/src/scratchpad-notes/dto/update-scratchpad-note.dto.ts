import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateScratchpadNoteDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @IsOptional()
  @IsString()
  content?: string;
}
