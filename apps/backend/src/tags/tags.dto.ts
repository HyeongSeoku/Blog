import { IsOptional, Length } from 'class-validator';

export class CreateTagDto {
  @Length(0, 45)
  @IsOptional()
  name?: string;
}
